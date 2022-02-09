const { OutletService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((value) => {

			this.power = value || false;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(this.power);

		}, true);

		this.changeHandler = (state) =>
		{
			if(state.value != null)
			{
				this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value);

				this.setState(state.value, () => {});
			}
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.power + '] ( ' + this.id + ' )');

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.power + '] ( ' + this.id + ' )');
					
						super.setState(this.power, () => {});
					}
					
					callback(null, this.power);
				});
			}
		});
	}

	setState(value, callback)
	{
		DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				this.power = value;

				super.setState(this.power,
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.power + '] ( ' + this.id + ' )'));

				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : value });

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
		if(state.power != null && !isNaN(state.power) && this.power != state.power)
		{
			this.power = state.power;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(state.power);

			super.setState(state.power,
				() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + state.power + '] ( ' + this.id + ' )'));
		
			this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : state.power });
		}
	}
}