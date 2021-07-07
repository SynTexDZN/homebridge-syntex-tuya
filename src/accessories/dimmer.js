let Characteristic, DeviceManager, AutomationSystem;

const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		DeviceManager = manager.DeviceManager;
		AutomationSystem = manager.AutomationSystem;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((power) => super.getBrightness((brightness) => {

			this.power = power || false;
			this.brightness = brightness || 50;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);
			this.service.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);

			this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

		}));

		this.changeHandler = (state) => {

			state.power = state.value;

			this.setToCurrentBrightness(state, () => {

				if(state.value != null)
				{
					this.service.getCharacteristic(Characteristic.On).updateValue(state.value);

					super.setState(state.value, () => {});
				}

				if(state.brightness != null)
				{
					this.service.getCharacteristic(Characteristic.Brightness).updateValue(state.brightness);

					super.setBrightness(state.brightness, () => {});
				}
			});
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this.id).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
					
						super.setState(this.power, () => {});
					}
					
					callback(null, this.power);
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

					if(value != null && !isNaN(value))
					{
						this.brightness = value;

						super.setBrightness(this.brightness, () => {});
					}
					
					callback(null, this.brightness);
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

		if(state.power != null && !isNaN(state.power) && this.power != state.power)
		{
			this.power = state.power;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);

			changed = true;
		}

		if(state.brightness != null && !isNaN(state.brightness) && this.brightness != state.brightness)
		{
			this.brightness = state.brightness;

			this.service.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);

			changed = true;
		}
		
		super.setState(state.power, () => {});
		super.setBrightness(state.brightness, () => {});

		if(changed)
		{
			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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
			setTimeout(() => {

				if(!this.running)
				{
					this.running = true;

					if(this.changedPower)
					{
						if(this.power == false)
						{
							DeviceManager.setState(this.id, this.power).then((success) => {

								if(success)
								{
									this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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
						else
						{
							DeviceManager.setBrightness(this.id, this.brightness).then((success) => {

								if(success)
								{
									this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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

						AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : this.power, brightness : this.brightness });
					}
					else if(this.changedBrightness)
					{
						DeviceManager.setBrightness(this.id, this.brightness).then((success) => {

							if(success)
							{
								this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [power: ' + this.power + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
							}
	
							this.offline = !success;

							if(callback)
							{
								callback(this.offline);
							}

							this.changedBrightness = false;
	
							this.running = false;
						});

						AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : this.power, brightness : this.brightness });
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