let Characteristic, DeviceManager;

const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((power) => super.getBrightness((brightness) => {

			this.power = power || false;
			this.brightness = brightness || 100;

			this.logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

		}));

		this.changeHandler = (state) =>
		{
			if(state.power != null)
			{
				this.homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state.power);

				this.setState(state.power, () => {});
			}

			if(state.brightness != null)
			{
				this.homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).updateValue(state.brightness);

				this.setBrightness(state.brightness, () => {});
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
		this.setToCurrentBrightness({ power : value }, (offline) => {

			if(!offline)
			{
				super.setState(value,
					() => callback(null));
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
		this.setToCurrentBrightness({ brightness : value }, (offline) => {

			if(!offline)
			{
				super.setBrightness(value,
					() => callback(null));
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

	setToCurrentBrightness(state, callback)
	{
		if(state.power != null && this.power != state.power)
		{
			this.power = state.power;

			this.changedPower = true;
		}

		if(state.brightness != null && this.brightness != state.brightness)
		{
			this.brightness = state.brightness;

			this.changedBrightness = true;
		}

		if(this.changedPower || this.changedBrightness)
		{
			setTimeout(async () => {

				if(!this.running)
				{
					this.running = true;

					if(this.changedPower)
					{
						DeviceManager.setState(this.id, this.power).then((success) => {

							if(success)
							{
								this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
							}

							this.offline = !success;

							if(callback)
							{
								callback(this.offline);
							}

							this.changedPower = false;
	
							this.running = false;
						});
					}
					else if(this.changedBrightness)
					{
						DeviceManager.setBrightness(this.id, this.brightness).then((success) => {

							if(success)
							{
								this.logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
							}
	
							this.offline = !success;

							if(callback)
							{
								callback(this.offline);
							}

							this.changedBrightness = false;
	
							this.running = false;
						});
					}
					else
					{
						if(callback)
						{
							callback(this.offline);
						}

						this.running = false;
					}
				}
				else if(callback)
				{
					callback(this.offline);
				}

			}, 100);
		}
		else if(callback)
		{
			callback(this.offline);
		}
	}
}