const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.min = serviceConfig.min || 10;
		this.max = serviceConfig.max || 100;

		this.changeHandler = (state) => {

			this.setToCurrentBrightness(state, (offline) => {

				if(!offline)
				{
					if(state.value != null)
					{
						super.setState(state.value,
							() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
					}

					if(state.brightness != null)
					{
						super.setBrightness(state.brightness,
							() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness));
					}

					this.AutomationSystem.LogikEngine.runAutomation(this, state);
				}
			});
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null)
					{
						this.value = state.value;

						super.setState(state.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + state.value + ', brightness: ' + state.brightness + '] ( ' + this.id + ' )'));
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
				super.setState(value, () => callback());

				this.AutomationSystem.LogikEngine.runAutomation(this, { value, brightness : this.brightness });
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}

	getBrightness(callback)
	{
		super.getBrightness((brightness) => {

			if(super.hasState('brightness'))
			{
				this.brightness = brightness;

				callback(null, brightness);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.brightness != null)
					{
						this.brightness = state.brightness;
						
						super.setBrightness(state.brightness, () => {});
					}
					
					callback(null, this.brightness);
				});
			}
		});
	}

	setBrightness(brightness, callback)
	{
		this.setToCurrentBrightness({ brightness }, (offline) => {

			if(!offline)
			{
				super.setBrightness(brightness, () => callback());

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness });
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}

	updateState(state)
	{
		if(!this.running)
		{
			var changed = false;

			if(state.value != null)
			{
				if(!super.hasState('value') || this.value != state.value)
				{
					changed = true;
				}

				this.value = state.value;

				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			if(state.brightness != null)
			{
				if(!super.hasState('brightness') || this.brightness != state.brightness)
				{
					changed = true;
				}

				this.brightness = state.brightness;

				super.setBrightness(state.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness));
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		}
	}

	setToCurrentBrightness(state, callback)
	{
		const setState = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value).then((success) => {

				if(success)
				{
					this.value = this.tempState.value;

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				this.offline = !success;

				if(callback)
				{
					callback(this.offline);
				}

				resolve();
			});
		};

		const setBrightness = (resolve) => {

			this.DeviceManager.setBrightness(this, this.tempState.brightness).then((success) => {

				if(success)
				{
					this.brightness = this.tempState.brightness;

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				this.offline = !success;

				if(callback)
				{
					callback(this.offline);
				}

				resolve();
			});
		};

		super.setToCurrentBrightness(state, (resolve) => {

			if(this.tempState.value)
			{
				setBrightness(resolve);
			}
			else
			{
				setState(resolve);
			}

		}, (resolve) => {

			setBrightness(resolve);

		}, (resolve) => {

			if(callback)
			{
				callback(this.offline);
			}

			resolve();
		});
	}
}