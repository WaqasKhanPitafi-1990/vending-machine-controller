var express = require('express');
var router = express.Router();
const decToHex = require("dec-to-hex");
const {crc16} = require('easy-crc');
const CommandProcessor = require('../command_cuboid/CommandProcessor');
const CommandCuboid = require('../command_cuboid/CommandCuboid');
const utils = require('../command_cuboid/utils');
const Order = require('../command_cuboid/Order');
const Utility = require('../utils/Utility.js');

const commandProcessor = new CommandProcessor(utils.SERIAL_PORT);
const commandCuboid = null;
commandProcessor.openSerialPortConnection();
const currentProcessingOrder = new Order();
const utility = new Utility();
/**
 * The following are the end points that the web cloud will call
 */

router.get('/machine-status/:machineNumber', function(req, res, next) {

     const machineNumber = req.params.machineNumber;
     const command = 100;
     const data =`${machineNumber}`;
     const app = utils.APP;
     const sendCommand = 0x1;
     const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
     res.sendStatus(200);
   
});

router.get('/status-of-channel/:machineNumber/:trayNumber/:channelNumber', function(req, res, next) {
  console.log(req.params);
  const machineNumber = req.params.machineNumber;
  const trayNumber = req.params.trayNumber;
  const channelNumber = req.params.channelNumber;
  const command = 101;
  const data =`${machineNumber},${trayNumber},${channelNumber}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  res.sendStatus(200);
});

router.get('/status-of-selection/:selectionNumber', function(req, res, next) {

  console.log(req.params);
     const selectionNumber = req.params.selectionNumber;
     const command = 102;
     const data =`${selectionNumber}`;
     const app = utils.APP;
     const sendCommand = 0x1;
     const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
     res.sendStatus(200);

     
});

router.get('/configure-params-for-dispensing/:selectionNumber/:dispensingSpeed/:time', function(req, res, next) {
     
  console.log(req.params);
  const selectionNumber = req.params.selectionNumber;
  const dispensingSpeed = req.params.dispensingSpeed;
  const time = req.params.time;
  const command = 103;
  const data =`${selectionNumber},${dispensingSpeed},${time}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});


router.get('/add-channel-to-selection/:selectionNumber/:machineNumber/:trayNumber/:channelNumber', function(req, res, next) {
     
  console.log(req.params);
  const selectionNumber = req.params.selectionNumber;
  const machineNumber = req.params.machineNumber;
  const trayNumber = req.params.trayNumber;
  const channelNumber = req.params.channelNumber;
  const command = 104;
  const data =`${selectionNumber},${machineNumber},${trayNumber},${channelNumber}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});


router.get('/request-machine-identification/:machineNumber', function(req, res, next) {
     
  console.log(req.params);
  const machineNumber = req.params.machineNumber;
  const command = 105;
  const data =`${machineNumber}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});


router.get('/request-programming-working-temperature/:machineNumber/:temperature', function(req, res, next) {
     
  const machineNumber = req.params.machineNumber;
  const temperature = req.params.temperature;
  const command = 106;
  const data =`${machineNumber},${temperature}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});


router.get('/request-dispensing-from-channel/:machineNumber/:trayNumber/:channelNumber/:dispensingSpeed/:time', function(req, res, next) {
     
  console.log(req.params);
  const tokenNumber = commandProcessor.generateToken();
  const machineNumber = req.params.machineNumber;
  const trayNumber = req.params.trayNumber;
  const channelNumber = req.params.channelNumber;
  const dispensingSpeed = req.params.dispensingSpeed;
  const time =  req.params.time;
  const command = 150;  
  const data =`${tokenNumber},${machineNumber},${trayNumber},${channelNumber},${dispensingSpeed},${time}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});



router.get('/request-dispensing-product/:tokenNumber/:selectionNumber', function(req, res, next) {
     
  console.log(req.params);
  const tokenNumber = req.params.tokenNumber;
  const selectionNumber = req.params.selectionNumber;
  const command = 151;
  const data =`${tokenNumber},${selectionNumber}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  return res.sendStatus(200);
  
});


router.get('/light/:machineNumber/:lightStatus', function(req, res, next) {
     
  console.log(req.params);
  const machineNumber = req.params.machineNumber;
  const lightStatus = req.params.lightStatus;
  const command = 152;
  const data =`${machineNumber},${lightStatus}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  res.sendStatus(200);
  
});



router.get('/request-for-reset-faults/:machineNumber', function(req, res, next) {
     
  console.log(req.params);
  const machineNumber = req.params.machineNumber;
  const command = 153;
  const data =`${machineNumber}`;
  const app = utils.APP;
  const sendCommand = 0x1;
  const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  res.sendStatus(200);
  
});


router.post('/deliver-order', function(req, res, next){
  // console.log(req.body);
  const {orderId, products, webHook} = req.body;
  
  currentProcessingOrder.setOrderId(orderId);
  currentProcessingOrder.setWebHook(webHook);
  currentProcessingOrder.setUtility(utility);

  products.forEach(p => {
    let tokenNumber = commandProcessor.generateToken();
    let machineNumber = p.machineNumber;
    let trayNumber = p.trayNumber;
    let channelNumber = p.channelNumber;
    let dispensingSpeed = p.dispensingSpeed;
    let time =  150;
    let command = 150;  
    let data =`${tokenNumber},${machineNumber},${trayNumber},${channelNumber},${dispensingSpeed},${time}`;
    let app = utils.APP;
    let sendCommand = 0x1;
    currentProcessingOrder.addProduct(
      {
        productId: p.productId,
        tokenNumber,
        deliveryStatus: 'queued'
      }
    );
    commandProcessor.setCurrentProcessingOrder(currentProcessingOrder);
    let commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
  });
  return res.sendStatus(200);
});



router.post('/synchronize-machine-configurations', function(req, res, next){
  const machines = req.body.machines;
  machines.forEach((m,i) => {
    console.log(i);
    commandProcessor.vendingMachines[i].traysChannels = [];
    m.trays.forEach((t,j) => {
      commandProcessor.vendingMachines[i].traysChannels.push([]);
      t.channels.forEach((c,k) => {
        commandProcessor.vendingMachines[i].traysChannels[j].push({quantity: c.quantity});
      });
    });
  });
  
  return res.sendStatus(200);
});



// router.get('/vend', function(req, res, next) {
     
//   console.log(req.params);
//   http://localhost:3000/request-dispensing-from-channel/1/11/0/0/150

//   const data = [

//   ]

//   const tokenNumber = commandProcessor.generateToken();
//   const machineNumber = req.params.machineNumber;
//   const trayNumber = req.params.trayNumber;
//   const channelNumber = req.params.channelNumber;
//   const dispensingSpeed = req.params.dispensingSpeed;
//   const time =  req.params.time;
//   const command = 150;  
//   const data =`${tokenNumber},${machineNumber},${trayNumber},${channelNumber},${dispensingSpeed},${time}`;
//   const app = utils.APP;
//   const sendCommand = 0x1;
//   const commandBytes = commandProcessor.buildCommand(command, app, data, sendCommand);
//   return res.sendStatus(200);
  
// });

module.exports = router;
