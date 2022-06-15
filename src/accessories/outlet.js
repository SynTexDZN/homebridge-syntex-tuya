const { OutletService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.changeHandler = (state) => {

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

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + value + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null)
					{
						this.value = state.value;

						super.setState(state.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + state.value + '] ( ' + this.id + ' )'));
					}
					
					callback(null, this.value);
				});
			}
		});
	}

	setState(value, callback)
	{
		this.DeviceManager.setState(this, value).then((success) => {

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

		if(changed)
		{
			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.value + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
	}
}