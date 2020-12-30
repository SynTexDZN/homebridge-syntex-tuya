const { UniversalAccessory } = require('homebridge-syntex-dynamic-platform');

const OutletService = require('./accessories/outlet');
const DimmedBulbService = require('./accessories/dimmer');
const SceneSwitchService = require('./accessories/sceneSwitch');

module.exports = class SynTexUniversalAccessory extends UniversalAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
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

		console.log(1, 'INIT DEVICES', type, this.platform.discoverScenes, typeof this.platform.discoverScenes);

		if(type == 'switch' || type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'light' || type == 'dimmer')
		{
			serviceConfig.type = 'dimmer';

			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'scene' && this.platform.discoverScenes)
		{
			console.log(2, 'DISCOVER SCENES', this.platform.discoverScenes, typeof this.platform.discoverScenes);

			serviceConfig.type = 'switch';

			service = new SceneSwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}

		if(service != null)
		{
			this.service.push(service);
		}
	}
	
	getModel()
	{
		return 'Tuya ' + (this.services == 'light' ? 'Light Bulb' : this.services == 'switch' ? 'Outlet' : 'Accessory');
	}
};