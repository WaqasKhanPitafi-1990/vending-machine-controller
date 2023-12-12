const dotenv = require('dotenv').config();
var utils = {};
utils.PORT = process.env.PORT;
utils.APP = process.env.APP;
utils.SERIAL_PORT = process.env.SERIAL_PORT;
module.exports = utils;