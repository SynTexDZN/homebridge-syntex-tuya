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

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
                    
                    homebridgeAccessory.getServiceById(Service.Outlet, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(this.power);
                }
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

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
                
                    callback();
                });
            }
        });
    }
}