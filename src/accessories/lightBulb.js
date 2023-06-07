const { LightBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexLightBulbService extends LightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}
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

		}, super.hasState('value'));
	}

	setState(value, callback)
	{
		this.DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				super.setState(value, () => callback());

				this.AutomationSystem.LogikEngine.runAutomation(this, { value });
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
}