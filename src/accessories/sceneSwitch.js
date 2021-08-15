let Characteristic, DeviceManager, AutomationSystem;

const { SwitchService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexOutletService extends SwitchService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		DeviceManager = manager.DeviceManager;
		AutomationSystem = manager.AutomationSystem;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.service.getCharacteristic(Characteristic.On).updateValue(false);

		this.setState(false, () => {});

		this.changeHandler = (state) =>
		{
			if(state.value == true)
			{
				this.service.getCharacteristic(Characteristic.On).updateValue(state.value);
			}
		};
	}

	getState(callback)
	{
		callback(null, false);
	}

	setState(value, callback)
	{
		DeviceManager.setState(this.id, value).then((success) => {

			if(success)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [triggered] ( ' + this.id + ' )');
				
				callback();

				setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(false), 2000);
			}
			else
			{
				callback(new Error('Offline'));
			}
		});

		AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : value });
	}
}