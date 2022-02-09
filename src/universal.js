const { UniversalAccessory } = require('homebridge-syntex-dynamic-platform');

const OutletService = require('./accessories/outlet');
const DimmedBulbService = require('./accessories/dimmedBulb');
const SceneSwitchService = require('./accessories/sceneSwitch');

module.exports = class SynTexUniversalAccessory extends UniversalAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		if(deviceConfig.services == 'switch')
		{
			deviceConfig.services = 'outlet';
		}
		else if(deviceConfig.services == 'light' || deviceConfig.services == 'dimmer')
		{
			deviceConfig.services = 'dimmer';
		}
		else if(deviceConfig.services == 'scene' && manager.platform.discoverScenes)
		{
			deviceConfig.services = 'switch';
		}

		super(homebridgeAccessory, deviceConfig, manager);
	}
	
	setService(config, subtype)
	{
		var serviceConfig = { name : this.name, type : config, subtype }, service = null;

		if(config instanceof Object)
		{
			for(const i in config)
			{
				serviceConfig[i] = config[i];
			}
		}

		if(Array.isArray(this.services) && this.services.length > 1 && this.name == serviceConfig.name)
		{
			serviceConfig.name = serviceConfig.name + ' ' + serviceConfig.type[0].toUpperCase() + serviceConfig.type.substring(1);

			if((JSON.stringify(this.services).match(new RegExp(serviceConfig.type, 'g')) || []).length > 1)
			{
				var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

				serviceConfig.name += ' ' + letters[subtype];
			}
		}

		var deviceConfig = { ...this.deviceConfig };

		if(config instanceof Object && config.id != null)
		{
			deviceConfig.id = config.id;
		}

		if(serviceConfig.type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'switch' && this.platform.discoverScenes)
		{
			service = new SceneSwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}

		if(service != null)
		{
			this.service.push(service);
		}
	}
	
	getModel()
	{
		var name = 'Accessory';

		if(this.services != null)
		{
			name = this.services;
		}

		if(this.services instanceof Object && this.services.type != null)
		{
			name = this.services.type;
		}

		if(Array.isArray(this.services))
		{
			name = 'Multi Accessory';
		}

		name = name[0].toUpperCase() + name.substring(1);

		return 'Tuya ' + name;
	}
};