const Switch = require('./switch');
var Service, Characteristic, DeviceManager, logger;

module.exports = class SynTexSwitchAccessory extends Switch
{
    constructor(id, name, Manager)
    {
        super(id, name, Manager);

        Service = Manager.Service;
        Characteristic = Manager.Characteristic;
        DeviceManager = Manager.DeviceManager;
        logger = Manager.logger;

        this.services = 'led';
        this.letters = '40';

        this.service[1] = new Service.Lightbulb(this.name);
        
        this.changeHandler = (function(state)
        {
            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

            this.service[1].getCharacteristic(Characteristic.On).updateValue(state);

        }).bind(this);
        
        this.service[1].getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    }

    getModel()
    {
        return 'Tuya Light Bulb'
    }

    getVersion()
    {
        return '1.0.0';
    }
}