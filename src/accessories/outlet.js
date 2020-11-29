const { OutletService } = require('homebridge-syntex-dynamic-platform/platform');

let Service, Characteristic, DeviceManager;

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        DeviceManager = manager.DeviceManager;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

        console.log(3, homebridgeAccessory != null, deviceConfig, serviceConfig);

		this.changeHandler = (function(state)
        {
            this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

            homebridgeAccessory.getServiceById(Service.Outlet, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);

        }).bind(this);
	}

	getState(callback)
    {
        super.getState((state) => {

            if(state != null)
            {
                callback(state);
            }
            else
            {
                DeviceManager.getDevice(this.id).then(function(state) {

                    if(state != null)
                    {
                        this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
                    }
                    /*
                    if(!data.online)
                    {
                        callback(new Error('Offline'));
                    }
                    */
                    this.setValue('state', state);

                    callback(null, state);
            
                }.bind({ logger : this.logger, setValue : super.setValue })).catch((e) => {
            
                    this.logger.err(e);
            
                    callback(e);
                });
            }
        });
    }

    setState(state, callback)
    {
        super.setState(state, () => {

            if(this.power != state)
            {
                this.power = state;

                DeviceManager.setDevice(this.id, this.power).then(function() {

                    this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
                    
                    callback(null);
            
                }.bind(this)).catch((e) => {
            
                    this.logger.err(e);
            
                    callback(e);
                });
            }
            else
            {
                callback(null);
            }
        });
    }
}