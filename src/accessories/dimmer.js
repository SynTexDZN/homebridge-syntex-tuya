const { DimmedLightBulbService } = require('homebridge-syntex-dynamic-platform/platform');

let Service, Characteristic, DeviceManager;

module.exports = class SynTexDimmedLightBulbService extends DimmedLightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        DeviceManager = manager.DeviceManager;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

        this.changeHandler = (state) =>
        {
            this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + state.power + ', brightness: ' + state.brightness + '] ( ' + this.id + ' )');

            super.setValue('state', state.power);
            super.setValue('brightness', state.brightness);

            homebridgeAccessory.getServiceById(Service.Lightbulb, 'dimmer-' + serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state.power);
            homebridgeAccessory.getServiceById(Service.Lightbulb, 'dimmer-' + serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).updateValue(state.brightness);
        };
    }

    getState(callback)
    {
        super.getState((state) => {

            if(state != null)
            {
                callback(null, state);
            }
            else
            {
                DeviceManager.getState(this.id).then((state) => {

                    if(state != null)
                    {
                        this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
                    
                        super.setValue('state', state.power);
                    }
                    /*
                    if(!data.online)
                    {
                        callback(new Error('Offline'));
                    }
                    */
                    callback(null, state != null ? state : false);
            
                }).catch((e) => {
            
                    this.logger.err(e);
            
                    callback(e);
                });
            }
        });
    }

    setState(state, callback)
    {
        super.setState(state, () => {

            this.power = state;

            DeviceManager.setState(this.id, this.power).then(() => {

                this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
                
                callback();
        
            }).catch((e) => {
        
                this.logger.err(e);
        
                callback(e);
            });
        });
    }

    getBrightness(callback)
    {
        super.getBrightness((state) => {

            if(state != null)
            {
                callback(null, state);
            }
            else
            {
                DeviceManager.getBrightness(this.id).then((state) => {

                    if(state != null)
                    {
                        this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
                    
                        super.setValue('brightness', state);
                    }
                    /*
                    if(!data.online)
                    {
                        callback(new Error('Offline'));
                    }
                    */
                    callback(null, state != null ? state : 50);

                }).catch((e) => {

                    this.logger.err(e);

                    callback(e);
                });
            }
        });
    }

    setBrightness(state, callback)
    {
        super.setBrightness(state, () => {

            if(this.brightness != state)
            {
                this.brightness = state;

                DeviceManager.setBrightness(this.id, this.brightness).then(() => {

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
            
                }).catch((e) => {
            
                    this.logger.err(e);
                });
            }

            callback();
        });
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