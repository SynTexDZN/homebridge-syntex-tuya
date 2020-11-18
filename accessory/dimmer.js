const Switch = require('./switch');
var Service, Characteristic, DeviceManager, logger;

module.exports = class SynTexSwitchAccessory extends Switch
{
    constructor(accessoryConfig, Manager)
    {
        super(accessoryConfig, Manager);

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
        this.service[1].getCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
    }

    getBrightness(callback)
    {
        DeviceManager.getDevice(this.id).then(function(state) {

            if(state != null)
            {
                logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
            }
            /*
            if(!data.online)
            {
                callback(new Error('Offline'));
            }
            */
            callback(null, state ? 100 : 0);
    
        }.bind(this)).catch(function(e) {
    
            logger.err(e);
    
            callback(e);
        });
    }

    setBrightness(state, callback)
    {
        /*
        DeviceManager.setDevice(this.id, state).then(function() {

            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
            
            callback();
    
        }.bind(this)).catch(function(e) {
    
            logger.err(e);
    
            callback(e);
        });
        */
       callback();
    }

    getModel()
    {
        return 'Tuya Dimmer Bulb'
    }

    getVersion()
    {
        return '1.0.0';
    }
}