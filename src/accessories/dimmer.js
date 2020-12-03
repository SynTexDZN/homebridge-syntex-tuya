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

        this.changeHandler = async (state, refreshDevices) =>
        {
            if(state.power != null)
            {
                var success = true;

                if(refreshDevices)
                {
                    success = await DeviceManager.setState(this.id, state.power);
                }

                if(success)
                {
                    this.power = state.power;

                    super.setValue('state', this.power);

                    homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(this.power);
                }
            }

            if(state.brightness != null)
            {
                var success = true;

                if(refreshDevices)
                {
                    success = await DeviceManager.setBrightness(this.id, state.brightness);
                }

                if(success)
                {
                    this.brightness = state.brightness;

                    super.setValue('brightness', this.brightness);

                    homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
                }
            }

            if(success)
            {
                this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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
                    
                    callback(null, state != null ? state : false);
                });
            }
        });
    }

    setState(state, callback)
    {
        this.power = state;

        DeviceManager.setState(this.id, this.power).then((success) => {

            if(success)
            {
                super.setState(state, () => {

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
                
                    callback();
                });
            }
            else
            {
                callback(new Error('Offline'));
            }
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

                        super.setValue('brightness', this.brightness);
                    }
                    
                    callback(null, state != null ? state : 50);
                });
            }
        });
    }

    setBrightness(state, callback)
    {
        this.brightness = state;

        DeviceManager.setBrightness(this.id, this.brightness).then((success) => {

            if(success)
            {
                super.setBrightness(state, () => {

                    callback();
                });
            }
            else
            {
                callback(new Error('Offline'));
            }
        });
    }
}