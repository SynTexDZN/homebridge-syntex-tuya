const { BaseService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexUniversalAccessory extends BaseService
{
    constructor(homebridgeAccessory, deviceConfig, manager)
    {
        super(homebridgeAccessory, deviceConfig, manager);
    }
}