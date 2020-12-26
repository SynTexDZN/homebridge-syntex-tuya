let Characteristic, DeviceManager;

const { OutletService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((value) => {

			this.power = value || false;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);

		}, true);

		this.changeHandler = (state) =>
		{
			if(state.value != null)
			{
				this.service.getCharacteristic(Characteristic.On).updateValue(state.value);

				this.setState(state.value, () => {});
			}
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;

				this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + this.power + '] ( ' + this.id + ' )');

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this.id).then((value) => {

					if(value != null)
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + this.power + '] ( ' + this.id + ' )');
					
						super.setState(this.power, () => {});
					}
					
					callback(null, this.power);
				});
			}
		});
	}

	setState(value, callback)
	{
		DeviceManager.setState(this.id, value).then((success) => {

			if(success)
			{
				this.power = value;

				super.setState(this.power, () => {

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
		if(state.power != null && this.power != state.power)
		{
			this.power = state.power;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);

			this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + this.power + '] ( ' + this.id + ' )');
		}
		
		super.setState(state.power, () => {});
	}
}