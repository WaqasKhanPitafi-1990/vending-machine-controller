class VendingMachine {
    constructor() {
      this.traysChannels = [
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
        [{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0},{quantity: 0, channelStatus: 0}],
      ];
      this.doorStatus = 0;//0: door opened, 1: door closed
      this.communicationStatus = 0;//0: machine not connected, 1: machine connected, 2: machine has lost connection
      this.serviceStatus = 0;//0: machine out of order, 1: machine in service
      this.currentDispensingToken = '00000';
      /**
       * 0: machine free, 
       * 1: machine busy (not available to perform dispensing), 
       * 2: machine busy (already performing a dispense), 
       * 3: machine busy (product detector blocked by a product, advice customer to collect product)
       * */
      this.machineAvailabilityForDispensingStatus = 0;
      /**
       * 0: dispensation received
       * 1: dispensation in course
       * 2: waiting for the product to be collected by the user
       * 3: product collected; dispensation finished successully
       * 4: dispensation not performed(error)
       * 5: token not found. might have been received or already lost from the dispensation cue
       * 6: dispensation queue is full, the request will not be processed
       */
      this.dispensingStatus = 0;
      this.lightStatus = 0;//0: light off, 1: light on
      this.CurrentMachineTemperature = "+00.0";
      this.machineSerialNumber = '';
      this.machineModel = '';
      this.machineFirmware = '';
      this.eventsList = [];//{dateTime:..., eventNumber:..., textualRepresentation:..., statusOfEvent: 0: device ok, 1: device event active}
      
    }
    
    setTraysChannels(traysChannels) {
      this.traysChannels = traysChannels;
    }

    getTraysChannels() {
      return this.traysChannels;
    }

    setDoorStatus(doorStatus) {
      this.doorStatus = doorStatus;
    }
    getDoorStatus() {
      return this.doorStatus;
    }
    
    setCommunicationStatus(communicationStatus) {
      this.communicationStatus = communicationStatus;
    }
    
    getCommunicationStatus() {
      return this.communicationStatus;
    }

    setServiceStatus(serviceStatus) {
      this.serviceStatus = serviceStatus;
    }

    getServiceStatus() {
      return this.serviceStatus;
    }

    setCurrentDispensingToken(token) {
      this.currentDispensingToken = token;
    }

    getCurrentDispensingToken() {
      return this.currentDispensingToken;
    }

    setMachineAvailabilityForDispensingStatus(machineAvailabilityForDispensingStatus) {
      this.machineAvailabilityForDispensingStatus = machineAvailabilityForDispensingStatus;
    }
        
    getMachineAvailabilityForDispensingStatus() {
      return this.machineAvailabilityForDispensingStatus;
    }

    setDispensingStatus(dispensingStatus) {
      if(dispensingStatus === 0 || dispensingStatus === 1) {
        this.machineAvailabilityForDispensingStatus = 2;
      } else if(dispensingStatus === 2) {
        this.machineAvailabilityForDispensingStatus = 3;
      } else if(dispensingStatus === 4 || dispensingStatus === 6) {
        this.machineAvailabilityForDispensingStatus = 1;
      } else {
        this.machineAvailabilityForDispensingStatus = 0;
      }
      this.dispensingStatus = dispensingStatus;
    }
        
    getDispensingStatus() {
      return this.dispensingStatus;
    }
    
    setLightStatus(lightStatus) {
      this.lightStatus = lightStatus;
    }

    getLightStatus() {
      return this.lightStatus;
    }

    setCurrentMachineTemperature(currentMachineTemperature) {
      this.currentMachineTemperature =  currentMachineTemperature;
    }
    
    getCurrentMachineTemperature() {
      return this.currentMachineTemperature;
    }

    setMachineSerialNumber(machineSerialNumber) {
      this.machineSerialNumber  = machineSerialNumber;
    }

    getMachineSerialNumber() {
      return this.machineSerialNumber;
    }

    setMachineModel(machineModel) {
      this.machineModel = machineModel;
    }

    getMachineModel() {
      return this.machineModel;
    }

    setMachineFirmware(machineFirmWare) {
      this.machineFirmware = machineFirmWare;
    }

    getMachineFirmware() {
      return this.machineFirmware;
    }

    addEvent(event) {
      if(event.eventNumber === '1') {
        event.textualRepresentation = 'Product detector';
      } else if(event.eventNumber === '2') {
        event.textualRepresentation = 'None of the motors (channels) are connected. Possible Control Board faulty';
      } else if(event.eventNumber === '3') {
        event.textualRepresentation = 'Channels jam detector';
      } else if(event.eventNumber === '4') {
        event.textualRepresentation = 'Temperature controller error';
      } else if(event.eventNumber === '5') {
        event.textualRepresentation = 'Elevator faulty';
      } else if(event.eventNumber === '6') {
        event.textualRepresentation = 'Photosensor, which determine the position of the elevator in relation with the cabinet, faulty';
      } else if(event.eventNumber === '7') {
        event.textualRepresentation = 'Elevator tester (flap), ES-Plus, faulty';        
      } else if(event.eventNumber === '8') {
        event.textualRepresentation = 'Product expired';
      } else {
        event.textualRepresentation = 'Unknown';
      }
      this.eventsList.push(event);
    }

    getEventsList() {
      return this.eventsList;
    }

    updateChannelStatus(trayNumber, channelNumber, channelStatus) {
      console.log('updateChannelStatus');
      console.log('trayNumber',(trayNumber-11));
      console.log('this.traysChannels[trayNumber]',this.traysChannels[trayNumber-11]);
      this.traysChannels[trayNumber-11][channelNumber]['channelStatus'] = channelStatus;
    }

    printMachine() {
      this.traysChannels.forEach(t => {
        console.log(t);
      })
      // console.log(this);
    }
  }

  module.exports = VendingMachine;