const decToHex = require("dec-to-hex");
const {crc16} = require('easy-crc');
const CommandCuboid = require('./CommandCuboid');
const {SerialPort} = require('serialport');
const {InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout');
const Queue = require('./Queue');
const utils = require('./utils');
const VendingMachine = require("./VendingMachine");

class CommandProcessor {
    constructor(serialPort) {
        this.identifying = 0x1;
        this.port = null;
        this.outgoingCommandsQueue = new Queue();
        this.dispensationQueue = new Queue();
        this.allowedBreakDownCommands = [200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 150];
        this.commandsWaitingForAck = [];
        const instance = this;
        this.serialPort = serialPort;
        this.vendingMachines = [new VendingMachine(), new VendingMachine(), new VendingMachine(), new VendingMachine()];
        this.currentDispensingToken = 1;
        this.currentProcessingOrder = null;
        setInterval(function(){ instance.processOutgoingQueue(instance);},1000);
    }

    openSerialPortConnection() {
        this.port = new SerialPort({
            path: this.serialPort,
            baudRate: 9600,
            dataBits: 8
        });
        
        this.port.on('error', (error) => {
           console.log(error);
        });
        
        this.port.on('open', () => {
            console.log("Open");
        });
        
        this.port.on('close', () => {
            console.log("Close");
        });

        let parser = this.port.pipe(new InterByteTimeoutParser({interval: 20}));
        parser.on('data', (data) => {
            if (data.length < 512) {
                const commandCuboid = this.breakDownCommand(data);
                if(commandCuboid) {                    
                    const identifying = commandCuboid.getIdentifying();
                    const crc = crc16('BUYPASS',[0xc0,0x02,identifying]);
                    const lowerNumber = crc>>>8;
                    const higherNumber = crc & 0xff;
                    //send the async command for the command that has been received just now
                    this.writeToJSD(Buffer.from([0xc0,0x02,identifying,lowerNumber,higherNumber,0xc0]), this);
                }
            }
        });
    }

    buildSendCommandStart(sendCode, identifying) { 
        //start flag, send code, identifying number
        return [0xc0, sendCode, identifying];
    }

    buildSendCommandMiddle(command, app, data) {
        //number of bytes of data, app number, command, data    
        let numOfBytes = 0;
        const dataConverted = [];
        [...data].forEach(c => {
            dataConverted.push(c.charCodeAt(0));
        });
        const lowerCommand = command>>>8;
        const higherCommand = command & 0xff;
        const lowerAppNumber = app>>>8;
        const higherAppNumber = app & 0xff;
        numOfBytes+=dataConverted.length + 6;
        const lowerNumBytes = numOfBytes>>>8;
        const higherNumBytes = numOfBytes & 0xff;
        return [higherNumBytes, lowerNumBytes, higherAppNumber, lowerAppNumber, higherCommand, lowerCommand,...dataConverted];
    }

    buildSendCommandEnd() {
        this.identifying += 0x01;
        return [0xc0];
    }

    buildCommand(command, app, data, sendCode) { 
        const identifying = this.identifying;
        let startMiddle = [...this.buildSendCommandStart(sendCode, identifying), ...this.buildSendCommandMiddle(command, app, data)];
        //I need to replace the bytes that are incorrect.
        startMiddle = this.replaceEscapeBytes(startMiddle, startMiddle.length);
        const crc = crc16('BUYPASS',startMiddle);
        const lowerNumber = crc>>>8;
        const higherNumber = crc & 0xff;
        let compiledCommand = [...startMiddle, lowerNumber, higherNumber, ...this.buildSendCommandEnd()];
        this.outgoingCommandsQueue.enqueue({identifying: identifying, command, compiledCommand});
        return compiledCommand;
    }

    breakDownCommand(input) {
        
        //strip the start and end flags
        //0 and length-1 start and end flags
        //1 send/ack/nack
        //2 identifying
        //3,4 number of bytes
        if(input[0] === 192 && input[input.length-1] === 192 && input.length>0 && input.length <= 512){
            input = this.replaceEscapeBytes(input, input.length-1);
            const commandCuboid = new CommandCuboid();
            input = input.slice(1,input.length-1);
            commandCuboid.setSendAckNack(input[0]);
            //Check if the command that has been received is for a 
            //command that we are waiting for an acknowledgment
            this.checkAckListForCommand(input);
            commandCuboid.setIdentifying(input[1]);
            const crcLow = input[input.length-2];
            const crcHigh = input[input.length-1];
            const crc = (crcLow<<8)+crcHigh;
            let crcCheckArray = [0xc0];
            for(let i=0;i<input.length-2;i++) {
                crcCheckArray.push(input[i]);
            }
            if(crc16('BUYPASS', crcCheckArray) === crc) {
                //the crc must match
                commandCuboid.setCRC([input[input.length-2],input[input.length-1]]);
                commandCuboid.setData(input.slice(2,input.length-2));
                const higherNumBytes = commandCuboid.getData()[0];
                const lowerNumBytes = commandCuboid.getData()[1];
                let numBytes = (lowerNumBytes<<8)+higherNumBytes;
                const higherAppNumber = commandCuboid.getData()[2];
                const lowerAppNumber = commandCuboid.getData()[3];
                commandCuboid.setAppNumber((lowerAppNumber<<8) + higherAppNumber);
                const higherCommand = commandCuboid.getData()[4];
                const lowerCommand = commandCuboid.getData()[5];
                const command = (lowerCommand<<8)+higherCommand;
                if(this.allowedBreakDownCommands.includes(command)) {
                    commandCuboid.setCommand(command);
                    numBytes-=6;//deduct 6 to remove the bytes that have already have been accounted for
                    //the remaining number of bytes are the actual data
                    let actualData = "";
                    if(numBytes === 1) {
                        actualData+=(String.fromCharCode(commandCuboid.getData()[6]));
                    } else {
                        const limit = numBytes + 5;
                        for(let i=6;i<=limit;i++) {
                            actualData+=(String.fromCharCode(commandCuboid.getData()[i]));
                        }
                    }
                    commandCuboid.setActualData(actualData);
                    this.updateVendingMachines(this, commandCuboid);
                    return commandCuboid;
                }
                return null;
            }
            return null;
        }
        return null;
    }

    
    replaceEscapeBytes(data, limit) {
        data.filter((d,i) => {
            if(i>0 && i < limit) {
                if(d === 0xc0) {
                    if(typeof data.splice === 'function') {
                        data.splice(i,1,0xdb);
                        data.splice(i+1,0,0xdc);
                    }
                } else if(d === 0xdb) {
                    if(typeof data.splice === 'function') {
                        data.splice(i+1,0,0xdd);
                    }
                }
            }
        });
        return data;
    }
   
  
    getOutgoingCommandsQueue() {
        return this.outgoingCommandsQueue;
    }

    writeToJSD(bytes, instance) {
        if(instance.port.isOpen) {
            instance.port.write(bytes);
        }
    }

    /**
     * 
     * The following two methods will be processing the incoming and outgoing queues
     */
    updateVendingMachines(instance, command) {
        if(command && command.command === 201){
            //machine status
            console.log('command updateVendingMachines',command);
            const actualDataParts = command.actualData.split(",");
            const machineNumber = parseInt(actualDataParts[0]);
            const machineCommunicationStatus = parseInt(actualDataParts[1]);
            const machineServiceStatus = parseInt(actualDataParts[2]);
            const machineDoorStatus = parseInt(actualDataParts[3]);
            const machineDispenseStatus = parseInt(actualDataParts[4]);
            const lightStatus = parseInt(actualDataParts[5]);
            const currentMachineTemperature = actualDataParts[6];
            this.vendingMachines[machineNumber].setCommunicationStatus(machineCommunicationStatus);
            this.vendingMachines[machineNumber].setServiceStatus(machineServiceStatus);
            this.vendingMachines[machineNumber].setDoorStatus(machineDoorStatus);
            this.vendingMachines[machineNumber].setMachineAvailabilityForDispensingStatus(machineDispenseStatus);
            this.vendingMachines[machineNumber].setLightStatus(lightStatus);
            this.vendingMachines[machineNumber].setCurrentMachineTemperature(currentMachineTemperature);
        }
        else if(command && command.command === 202) {
            const actualDataParts = command.actualData.split(",");
            const machineNumber = parseInt(actualDataParts[0]);
            const trayNumber = parseInt(actualDataParts[1]);
            const channelNumber = parseInt(actualDataParts[2]);
            const channelStatus = parseInt(actualDataParts[3]);
            this.vendingMachines[machineNumber].updateChannelStatus(parseInt(trayNumber), parseInt(channelNumber), channelStatus);
        }
        else if(command && command.command === 203) {
            
        } else if(command && command.command === 204) {
            console.log('command updateVendingMachines',command);
            const actualDataParts = command.actualData.split(",");
            const token = actualDataParts[0];
            const dispensationStatus = parseInt(actualDataParts[1]);
            const vendingMachine = this.vendingMachines.filter(vm => vm.getCurrentDispensingToken() === token);
            console.log('vending machine: ',vendingMachine);
            vendingMachine.length && vendingMachine[0]?.setDispensingStatus(dispensationStatus);
            this.currentProcessingOrder.updateProductDeliveryStatus(token,dispensationStatus);
            //TODO:change the light setting based on the delivery status
            


        } else if(command && command.command === 205) {
            
        } else if(command && command.command === 206) {
            
        } else if(command && command.command === 207) {
            const actualDataParts = command.actualData.split(",");
            const machineNumber = parseInt(actualDataParts[0]);
            const machineModel = parseInt(actualDataParts[1]);
            const machineSerialNumber = parseInt(actualDataParts[2]);
            const machineFirmWare = parseInt(actualDataParts[3]);
            this.vendingMachines[machineNumber].setMachineModel(machineModel);
            this.vendingMachines[machineNumber].setMachineSerialNumber(machineSerialNumber);
            this.vendingMachines[machineNumber].setMachineFirmware(machineFirmWare);
        } else if (command && command.command === 208) {
            const actualDataParts = command.actualData.split(",");
            const machineNumber = parseInt(actualDataParts[0]);
            const currentMachineTemperature = actualDataParts[2];
            this.vendingMachines[machineNumber].setCurrentMachineTemperature(currentMachineTemperature);
        } else if(command && command.command === 209) {
            const actualDataParts = command.actualData.split(",");
            const machineNumber = parseInt(actualDataParts[0]);
            const eventNumber = parseInt(actualDataParts[1]);
            const eventStatus = parseInt(actualDataParts[2]);
            this.vendingMachines[machineNumber].addEvent(
                {
                    dateTime: new Date().getTime(),
                    eventNumber,
                    statusOfEvent: eventStatus
                }
            );
        }
    }

    processOutgoingQueue(instance) {

        // this.vendingMachines.forEach((v,i) => {
        //     console.log('Machine ',i);
        //     v.printMachine();
        // });
        instance.dequeueDispendCommand(instance);
        if(instance.getOutgoingCommandsQueue().peek()){
            const command = instance.getOutgoingCommandsQueue().dequeue();
            if(command && command.compiledCommand) {
                if(command.command === 150) {
                    instance.enqueueDispendCommand(instance, command);
                } else {
                    instance.writeToJSD(command.compiledCommand, instance);
                    let foundCommand = false;
                    instance.commandsWaitingForAck.forEach((f,i) => {
                        if(f.identifying === command.identifying) {
                            if(f.count<3) {
                                instance.commandsWaitingForAck[i].count+=1;
                            }
                            foundCommand = true;
                        }
                    });
                    if(!foundCommand) {
                        instance.commandsWaitingForAck.push({identifying: command.identifying, startTime: new Date().getTime(), count: 0, command: command.compiledCommand});
                    }
                }
                  
            }
        }
    }

    checkAckListForCommand(input) {
        const now = new Date().getTime();
        this.commandsWaitingForAck.forEach((f,i)=>{
            if(f.count>3) {
                this.commandsWaitingForAck.splice(i,1);
            } else {

                if(input[0] === 0x02){
                    if(f.identifying === input[1]) {
                           this.commandsWaitingForAck.splice(i,1);
                    } else {
                        if(now-f.startTime>500) {
                            this.commandsWaitingForAck[i].count+=1;
                            this.outgoingCommandsQueue.enqueue({identifying: f.identifying, compiledCommand: f.command});
                        }
                    }
                } else {
                    if(now-f.startTime>500) {
                        this.commandsWaitingForAck[i].count+=1;
                        this.outgoingCommandsQueue.enqueue({identifying: f.identifying, compiledCommand: f.command});
                    }
                }
            }
        });
    }

    /**
     * This method creates the 5 character string token,
     * by prepending 0 before the actual number.
     * @param {*} instance 
     * @returns 
     */
    generateToken() {
        const numDigits = (this.currentDispensingToken+'').length;
        const remainingNumDigits = 5 - numDigits;
        let finalToken='';
        for(let i=0;i<remainingNumDigits;i++){
            finalToken+='0';
        }

        finalToken+=this.currentDispensingToken;
        this.currentDispensingToken+=1;
        return finalToken;
    }

    enqueueDispendCommand(instance, data) {
        const commandCuboid = instance.breakDownCommand(data.compiledCommand);
        if(commandCuboid){
            const actualDataParts = commandCuboid.actualData.split(",");
            const tokenNumber = actualDataParts[0];
            const machineNumber = parseInt(actualDataParts[1]);
            const trayNumber = parseInt(actualDataParts[2]);
            const channelNumber = parseInt(actualDataParts[3]);
            const vmData = {
                tokenNumber,
                machineNumber,
                trayNumber,
                channelNumber
            };
            instance.dispensationQueue.enqueue({data: vmData, compiledCommand: data.compiledCommand});
            
            console.log('enqueueDispendCommand machineNumber',machineNumber);
            console.log(instance.vendingMachines[machineNumber]);
            if(instance.vendingMachines[machineNumber].getMachineAvailabilityForDispensingStatus() === 0) {
                instance.vendingMachines[machineNumber].setCurrentDispensingToken(tokenNumber);
                const dispenseCommand = instance.dispensationQueue.dequeue();
                instance.writeToJSD(dispenseCommand.compiledCommand, instance);
            } 
            
        }
    }

    dequeueDispendCommand(instance) {
        if(instance.dispensationQueue.peek()){
        const dispenseCommand = instance.dispensationQueue.dequeue();
        console.log('dispenseCommand',dispenseCommand);
        const machineNumber = dispenseCommand.data.machineNumber;
        const tokenNumber = dispenseCommand.data.tokenNumber;
            console.log('dequeueDispendCommand machineNumber',machineNumber);
            console.log(instance.vendingMachines[machineNumber]);

            if(instance.vendingMachines[machineNumber].getMachineAvailabilityForDispensingStatus() === 0) {
                //The vending machine is free
                instance.vendingMachines[machineNumber].setCurrentDispensingToken(tokenNumber);
                instance.writeToJSD(dispenseCommand.compiledCommand, instance);
            } else {
                //The vending machine is not free so enqueue the command again
                instance.dispensationQueue.enqueue({data: dispenseCommand.data, compiledCommand: dispenseCommand.compiledCommand});
            }
        }
    }

    setCurrentProcessingOrder(currentProcessingOrder) {
        this.currentProcessingOrder = currentProcessingOrder;
    }

}

module.exports = CommandProcessor;