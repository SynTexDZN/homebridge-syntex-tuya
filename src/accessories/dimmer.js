let Characteristic, DeviceManager;

const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
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

					super.setState(this.power, () => {});

					this.homebridgeAccessory.services[1].getCharacteristic(Characteristic.On).updateValue(this.power);
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

					super.setBrightness(this.brightness, () => {});

					this.homebridgeAccessory.services[1].getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
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
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;

				this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this.id).then((value) => {

					if(value != null)
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
					
						super.setState(this.power, () => {});
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
		super.getBrightness((value) => {

			if(value != null)
			{
				this.brightness = value;

				callback(null, this.brightness);
			}
			else
			{
				DeviceManager.getBrightness(this.id).then((value) => {

					if(value != null)
					{
						this.brightness = value;

						super.setBrightness(this.brightness, () => {});
					}
					
					callback(null, value != null ? value : 50);
				});
			}
		});
	}

	setBrightness(value, callback)
	{
		this.brightness = value;

		DeviceManager.setBrightness(this.id, this.brightness).then((success) => {

			if(success)
			{
				super.setBrightness(value, () => callback());
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}

	updateState(state)
	{
		var changed = false;

		if(state.power != null && this.power != state.power)
		{
			this.power = state.power;

			this.homebridgeAccessory.services[1].getCharacteristic(Characteristic.On).updateValue(this.power);

			changed = true;
		}

		if(state.brightness != null && this.brightness != state.brightness)
		{
			this.brightness = state.brightness;

			this.homebridgeAccessory.services[1].getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);

			changed = true;
		}
		
		super.setState(state.power, () => {});
		super.setBrightness(state.brightness, () => {});

		if(changed)
		{
			this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
		}
	}
}