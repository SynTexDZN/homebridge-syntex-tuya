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
					this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
					this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);
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
		this.setToCurrentBrightness({ value }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Failed'));
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
		this.setToCurrentBrightness({ brightness }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Failed'));
			}
		});
	}

	updateState(state)
	{
		if(!this.running)
		{
			var changed = false;

			if(state.value != null && !isNaN(state.value))
			{
				if(!super.hasState('value') || this.value != state.value)
				{
					changed = true;
				}

				this.value = this.tempState.value = state.value;

				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			if(state.brightness != null && !isNaN(state.brightness))
			{
				if(!super.hasState('brightness') || this.brightness != state.brightness)
				{
					changed = true;
				}

				this.brightness = this.tempState.brightness = state.brightness;

				super.setBrightness(state.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness));
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
		}
	}

	setToCurrentBrightness(state, callback)
	{
		const setPower = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value).then((success) => {

				this.offline = !success;

				if(success)
				{
					this.value = this.tempState.value;

					super.setState(this.value, () => {}, true);
				}

				if(callback)
				{
					callback(this.offline);
				}

				this.setConnectionState(!this.offline,
					() => resolve(), true);

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
			});
		};

		const setBrightness = (resolve) => {

			this.DeviceManager.setBrightness(this, this.tempState.brightness).then((success) => {

				this.offline = !success;

				if(success)
				{
					this.value = this.tempState.value;
					this.brightness = this.tempState.brightness;

					super.setState(this.value, () => {});
					super.setBrightness(this.brightness, () => {});

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				if(callback)
				{
					callback(this.offline);
				}

				this.setConnectionState(!this.offline,
					() => resolve(), true);

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
			});
		};

		super.setToCurrentBrightness(state, (resolve) => {

			if(this.tempState.value)
			{
				setBrightness(resolve);
			}
			else
			{
				setPower(resolve);
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