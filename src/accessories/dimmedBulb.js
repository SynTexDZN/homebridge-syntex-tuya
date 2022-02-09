const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((value) => super.getBrightness((brightness) => {

			this.value = value || false;
			this.brightness = brightness || 50;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);

			this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
		}));

		this.changeHandler = (state) => {

			this.setToCurrentBrightness(state, () => {

				if(state.value != null)
				{
					this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value);

					super.setState(state.value, () => {});
				}

				if(state.brightness != null)
				{
					this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness);

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
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, this.value);
			}
			else
			{
				DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.value = value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
					
						super.setState(this.value, () => {});
					}
					
					callback(null, this.value);
				});
			}
		});
	}

	setState(value, callback)
	{
		this.setToCurrentBrightness({ value }, (offline) => {

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
				DeviceManager.getBrightness(this).then((value) => {

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

		if(state.value != null && !isNaN(state.value) && this.value != state.value)
		{
			this.value = state.value;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);

			changed = true;
		}

		if(state.brightness != null && !isNaN(state.brightness) && this.brightness != state.brightness)
		{
			this.brightness = state.brightness;

			this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);

			changed = true;
		}
		
		super.setState(state.value, () => {});
		super.setBrightness(state.brightness, () => {});

		if(changed)
		{
			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
		}
	}

	setToCurrentBrightness(state, callback)
	{
		if(state.value != null && this.value != state.value)
		{
			this.value = state.value;

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
						if(this.value == false)
						{
							DeviceManager.setState(this, this.value).then((success) => {

								if(success)
								{
									this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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
							DeviceManager.setBrightness(this, this.brightness).then((success) => {

								if(success)
								{
									this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
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

						this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : this.value, brightness : this.brightness });
					}
					else if(this.changedBrightness)
					{
						DeviceManager.setBrightness(this, this.brightness).then((success) => {

							if(success)
							{
								this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
							}
	
							this.offline = !success;

							if(callback)
							{
								callback(this.offline);
							}

							this.changedBrightness = false;
	
							this.running = false;
						});

						this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : this.value, brightness : this.brightness });
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