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

			this.setToCurrentBrightness(state, (failed) => {

				if(!failed)
				{
					this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
					this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);
				}
			});
		};
	}

	getState(callback)
	{
		super.getState(() => {

			if(!super.hasState('value'))
			{
				this.DeviceManager.getState(this).then((state) => {

					this.updateState(state);
					
					callback(null, this.value);
				});
			}
			else
			{
				callback(null, this.value);
			}

		}, super.hasState('value') || super.hasState('brightness'));
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
				callback(new Error('Offline'));
			}
		});
	}

	getBrightness(callback)
	{
		super.getBrightness(() => {

			if(!super.hasState('brightness'))
			{
				this.DeviceManager.getState(this).then((state) => {

					this.updateState(state);
					
					callback(null, this.brightness);
				});
			}
			else
			{
				callback(null, this.brightness);
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
				callback(new Error('Offline'));
			}
		});
	}

	updateState(state)
	{
		if(!this.running)
		{
			var changed = false;

			if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
			{
				this.tempState.value = state.value;

				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);

				changed = true;
			}

			if(state.brightness != null && !isNaN(state.brightness) && (!super.hasState('brightness') || this.brightness != state.brightness))
			{
				this.tempState.brightness = state.brightness;

				super.setBrightness(state.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness), false);

				changed = true;
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		}
	}

	setToCurrentBrightness(state, callback)
	{
		const setPower = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value).then((success) => {

				this.offline = !success;

				if(success)
				{
					super.setState(this.tempState.value);
				}

				if(callback != null)
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
					super.setState(this.tempState.value, null, false);
					super.setBrightness(this.tempState.brightness, null, false);

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
				}

				if(callback != null)
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

			if(this.tempState.value)
			{
				setBrightness(resolve);
			}
			else
			{
				if(callback != null)
				{
					callback(this.offline);
				}

				resolve();
			}

		}, (resolve) => {

			if(callback != null)
			{
				callback(this.offline);
			}

			resolve();
		});
	}
}