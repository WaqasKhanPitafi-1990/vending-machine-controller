class CommandCuboid {
    constructor(){
        this.identifying = 0x1;
        this.command = 0;
        this.sendAckNack = 0;
        this.data = [];
        this.crc = [];
        this.appNumber = 0;
        this.actualData = "";
    }

    setIdentifying(identifying) {
        this.identifying = identifying;
    }

    getIdentifying() {
        return this.identifying;
    }

    setCommand(command) {
        this.command = command;
    }

    getCommand() {
        return this.command;
    }

    setSendAckNack(sendAckNack) {
        this.sendAckNack = sendAckNack;
    }

    getSendAckNack() {
        return this.sendAckNack;
    }

    setData(data) {
        data.forEach(d=>this.data.push(d));
    }

    getData() {
        return this.data;
    }

    setCRC(crc) {
        crc.forEach(d=>this.crc.push(d));
    }

    getCRC() {
        return this.crc;
    }

    setAppNumber(appNumber) {
        this.appNumber = appNumber;
    }

    getAppNumber() {
        return this.appNumber;
    }

    setActualData(actualData) {
        this.actualData = actualData;
    }

    getActualData() {
        return this.actualData;
    }
}

module.exports = CommandCuboid;