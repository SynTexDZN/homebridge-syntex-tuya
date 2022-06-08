const { SwitchService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexOutletService extends SwitchService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.service.getCharacteristic(this.Characteristic.On).updateValue(false);

		super.setState(false, () => {});

		this.changeHandler = (state) => {
			
			if(state.value == true)
			{
				this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value);
			
				this.setState(state.value, () => {});
			}
		};
	}

	getState(callback)
	{
		callback(null, false);
	}

	setState(value, callback)
	{
		DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [triggered] ( ' + this.id + ' )');
				
				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });

				callback();

				setTimeout(() => this.service.getCharacteristic(this.Characteristic.On).updateValue(false), 2000);
			}
			else
			{
				callback(new Error('Offline'));
			}
		});
	}
}