const { BlindService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexBlindService extends BlindService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		super.updateProperties('target', { minStep : 50 });

		this.DeviceManager = manager.DeviceManager;

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setTargetPosition(state.value,
					() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.value));
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

		}, super.hasState('value') || super.hasState('target') || super.hasState('state'));
	}

	setTargetPosition(target, callback)
	{
		this.DeviceManager.setTargetPosition(this, target).then((success) => {

			if(success)
			{
				super.setTargetPosition(target, () => callback());

				this.updateTarget();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
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
		
		if(state.connection != null)
		{
			this.setConnectionState(state.connection, null, true);
		}

		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(state.value), false);

			changed = true;
		}

		if(state.target != null && !isNaN(state.target) && (!super.hasState('target') || this.target != state.target))
		{
			super.setTargetPosition(state.target, 
				() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.target), false);

			changed = true;
		}
		
		if(changed)
		{
			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
	}

	updateTarget()
	{
		super.setState(this.target,
			() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.target), false);
	}
}