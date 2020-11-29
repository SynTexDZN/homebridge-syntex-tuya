const UniversalAccessory = require('homebridge-syntex-dynamic-platform').UniversalAccessory;
var Service, Characteristic, DeviceManager, logger;

module.exports = class SynTexUniversalAccessory extends UniversalAccessory
{
    constructor(homebridgeAccessory, accessory, manager)
    {
        console.log('UNIVERSAL CONSTRUCTOR');
    }
};