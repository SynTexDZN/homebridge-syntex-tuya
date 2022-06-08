const { OutletService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.getState((value) => {

			this.value = value || false;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);

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
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + value + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				DeviceManager.getState(this).then((state) => {

					if(state != null && state.value != null)
					{
						this.value = state.value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + state.value + '] ( ' + this.id + ' )');

						super.setState(state.value, () => {});
					}
					
					callback(null, this.value);
				});
			}
		});
	}

	setState(value, callback)
	{
		DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				this.value = value;

				super.setState(value,
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + value + '] ( ' + this.id + ' )'));

				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });

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
		if(state.value != null && this.value != state.value)
		{
			this.value = state.value;

			this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value);

			super.setState(state.value,
				() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + state.value + '] ( ' + this.id + ' )'));
		
			this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : state.value });
		}
	}
}