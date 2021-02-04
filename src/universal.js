const { UniversalAccessory } = require('homebridge-syntex-dynamic-platform');

const OutletService = require('./accessories/outlet');
const DimmedBulbService = require('./accessories/dimmer');
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
		var name = this.name;
		var type = config;

		if(config instanceof Object)
		{
			if(config.name != null)
			{
				name = config.name;
			}
			
			if(config.type != null)
			{
				type = config.type;
			}
		}

		var service = null;
		var serviceConfig = { name : name, type : type, subtype : subtype };

		if(type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'scene' && this.platform.discoverScenes)
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
		return 'Tuya ' + (this.services == 'dimmer' ? 'Light Bulb' : this.services == 'relais' ? 'Outlet' : this.services == 'switch' ? 'Scene' : 'Accessory');
	}
};