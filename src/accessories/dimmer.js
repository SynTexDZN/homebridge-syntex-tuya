const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

let Service, Characteristic, DeviceManager;

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        DeviceManager = manager.DeviceManager;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

        this.changeHandler = (state) =>
        {
            if(state.power != null)
            {
                this.power = state.power;

                super.setValue('state', this.power);

                DeviceManager.setState(this.id, this.power).then(() => {

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
            
                    homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(this.power);
    
                }).catch((e) => {
            
                    this.logger.err(e);
                });
            }

            if(state.brightness != null)
            {
                this.brightness = state.brightness;

                super.setValue('brightness', this.brightness);

                DeviceManager.setBrightness(this.id, this.brightness).then(() => {

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
            
                    homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
    
                }).catch((e) => {
            
                    this.logger.err(e);
                });
            }
        };
    }

    getState(callback)
    {
        super.getState((state) => {

            if(state != null)
            {
                this.power = state;

                callback(null, this.power);
            }
            else
            {
                DeviceManager.getState(this.id).then((state) => {

                    if(state != null)
                    {
                        this.power = state;

                        this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
                    
                        super.setValue('state', this.power);
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
        this.power = state;

        DeviceManager.setState(this.id, this.power).then(() => {

            super.setState(state, () => {

                this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
            
                callback();
            });
    
        }).catch((e) => {
    
            this.logger.err(e);
    
            callback(e);
        });
    }

    getBrightness(callback)
    {
        super.getBrightness((state) => {

            if(state != null)
            {
                this.brightness = state;

                callback(null, this.brightness);
            }
            else
            {
                DeviceManager.getBrightness(this.id).then((state) => {

                    if(state != null)
                    {
                        this.brightness = state;

                        //this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
                    
                        super.setValue('brightness', this.brightness);
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
        this.brightness = state;

        DeviceManager.setBrightness(this.id, this.brightness).then(() => {

            super.setBrightness(state, () => {

                //this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
    
                callback();
            });
    
        }).catch((e) => {
    
            this.logger.err(e);
        });
    }
}