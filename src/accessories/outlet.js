const { OutletService } = require('homebridge-syntex-dynamic-platform');

let Service, Characteristic, DeviceManager;

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        DeviceManager = manager.DeviceManager;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

        this.changeHandler = (state) =>
        {
            this.power = state;

            super.setValue('state', this.power);

            DeviceManager.setState(this.id, this.power).then(() => {

                this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
        
                homebridgeAccessory.getServiceById(Service.Outlet, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(this.power);

            }).catch((e) => {
        
                this.logger.err(e);
            });
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

                        this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + this.power + '] ( ' + this.id + ' )');
                    
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

                this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
            
                callback();
            });
            
        }).catch((e) => {
    
            this.logger.err(e);
    
            callback(e);
        });
    }
}