const { SwitchService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexOutletService extends SwitchService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.changeHandler = (state) => {
			
			if(state.value == true)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}
		};
	}

	getState(callback)
	{
		callback(null, false);
	}

	setState(value, callback)
	{
		this.DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [triggered] ( ' + this.id + ' )');

				callback();
				
				setTimeout(() => this.service.getCharacteristic(this.Characteristic.On).updateValue(false), 2000);

				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}
}