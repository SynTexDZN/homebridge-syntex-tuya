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

        this.services = 'dimmer';
        this.letters = '40';

        this.service[1] = new Service.Lightbulb(this.name);
        
        this.changeHandler = (function(state)
        {
            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + state.power + ', brightness: ' + state.brightness + '] ( ' + this.id + ' )');

            this.service[1].getCharacteristic(Characteristic.On).updateValue(state.power);
            this.service[1].getCharacteristic(Characteristic.Brightness).updateValue(state.brightness);

        }).bind(this);
        
        this.service[1].getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
        this.service[1].getCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
    }

    getState(callback)
    {
        DeviceManager.getDevice(this.id).then(function(state) {

            if(state != null)
            {
                logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + state.power + ', brightness: ' + state.brightness + '] ( ' + this.id + ' )');
            }
            /*
            if(!data.online)
            {
                callback(new Error('Offline'));
            }
            */
            console.log(typeof state.power);

            callback(null, state != null ? state.power : false);
    
        }.bind(this)).catch(function(e) {
    
            logger.err(e);
    
            callback(e);
        });
    }

    setState(state, callback)
    {
        if(this.power != state)
        {
            this.power = state;

            DeviceManager.setDevice(this.id, { power : this.power, brightness : this.brightness }).then(function() {

                logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
                
                callback(null);
        
            }.bind(this)).catch(function(e) {
        
                logger.err(e);
        
                callback(e);
            });
        }
        else
        {
            callback(null);
        }
    }

    getBrightness(callback)
    {
        DeviceManager.getDevice(this.id).then(function(state) {

            if(state != null)
            {
                logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + state.power + ', brightness: ' + state.brightness + '] ( ' + this.id + ' )');
            }
            /*
            if(!data.online)
            {
                callback(new Error('Offline'));
            }
            */
            callback(null, state != null ? state.brightness : 50);

        }.bind(this)).catch(function(e) {

            logger.err(e);

            callback(e);
        });
    }

    setBrightness(level, callback)
    {
        if(this.brightness != level)
        {
            this.brightness = level;

            DeviceManager.setDevice(this.id, { power : this.brightness == 0 ? false : true, brightness : this.brightness }).then(function() {

                logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
        
            }.bind(this)).catch(function(e) {
        
                logger.err(e);
            });
        }

        callback(null);
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