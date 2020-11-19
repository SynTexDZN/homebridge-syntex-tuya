const Base = require('./base');
var Service, Characteristic, DeviceManager, logger;

module.exports = class SynTexSwitchAccessory extends Base
{
    constructor(accessoryConfig, Manager)
    {
        super(accessoryConfig, Manager);

        Service = Manager.Service;
        Characteristic = Manager.Characteristic;
        DeviceManager = Manager.DeviceManager;
        logger = Manager.logger;

        this.services = 'switch';
        this.letters = '40';

        this.service.push(new Service.Outlet(this.name));
        
        this.changeHandler = (function(state)
        {
            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

            this.service[1].getCharacteristic(Characteristic.On).updateValue(state);

        }).bind(this);
        
        this.service[1].getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    }

    getState(callback)
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
            callback(null, state);
    
        }.bind(this)).catch(function(e) {
    
            logger.err(e);
    
            callback(e);
        });
    }

    setState(state, callback)
    {
        if(this.power != powerOn)
        {
            this.power = powerOn;

            DeviceManager.setDevice(this.id, state).then(function() {

                logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
                
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

    getModel()
    {
        return 'Tuya Switch'
    }

    getVersion()
    {
        return '1.0.0';
    }
}