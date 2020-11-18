const TuyaWebApi = require('../tuyawebapi');
let DeviceManager = require('../device-manager'), logger = require('../logger');
const Base = require('./base');
var Service, Characteristic;

module.exports = class SynTexSwitchAccessory extends Base
{
    constructor(id, name, Manager)
    {
        super(id, name, Manager);

        Service = Manager.Service;
        Characteristic = Manager.Characteristic;

        this.services = 'switch';
        this.letters = '40';

        this.service.push(new Service.Outlet(this.name));
        /*
        DeviceManager.getDevice(this).then(function(state) {

            this.value = validateUpdate(this.mac, this.type, state);

        }.bind(this));
        */
        this.changeHandler = (function(state)
        {
            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

            this.service.getCharacteristic(Characteristic.On).updateValue(state);

        }).bind(this);
        
        this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
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
        DeviceManager.setDevice(this.id, state).then(function() {

            logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
            
            callback();

        }.bind(this)).catch(function(e) {

            logger.err(e);

            callback(e);
        });
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