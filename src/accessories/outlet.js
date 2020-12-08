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

		this.changeHandler = async (state) =>
		{
			if(state.power != null)
			{
				if(await DeviceManager.setState(this.id, state.power))
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
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this.id).then((value) => {

					if(value != null)
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + this.power + '] ( ' + this.id + ' )');
					
						super.setValue('state', this.power);
					}
					
					callback(null, value != null ? value : false);
				});
			}
		});
	}

	setState(value, callback)
	{
		this.power = value;

		DeviceManager.setState(this.id, this.power).then((success) => {

			if(success)
			{
				super.setState(value, () => {

					this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
				
					callback();
				});
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}

	updateState(state)
	{
		if(state.power != null)
		{
			if(this.power != state.power)
			{
				this.power = state.power;

				this.homebridgeAccessory.services[1].getCharacteristic(Characteristic.On).updateValue(this.power);

				this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
			}
			
			super.setState(state.power, () => {});
		}
	}
}