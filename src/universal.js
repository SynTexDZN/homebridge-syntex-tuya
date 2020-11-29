const UniversalAccessory = require('homebridge-syntex-dynamic-platform').UniversalAccessory;
const SwitchService = require('homebridge-syntex-dynamic-platform').SwitchService;
const OutletService = require('./accessories/outlet');
const LightBulbService = require('homebridge-syntex-dynamic-platform').LightBulbService;
const DimmedBulbService = require('homebridge-syntex-dynamic-platform').DimmedBulbService;
const ColoredBulbService = require('homebridge-syntex-dynamic-platform').ColoredBulbService;
const ContactService = require('homebridge-syntex-dynamic-platform').ContactService;

module.exports = class SynTexUniversalAccessory extends UniversalAccessory
{
    constructor(homebridgeAccessory, deviceConfig, manager)
    {
		super(homebridgeAccessory, deviceConfig, manager);
		
		console.log(1, homebridgeAccessory != null, deviceConfig);

        console.log('UNIVERSAL CONSTRUCTOR');
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

		console.log(2, this.homebridgeAccessory != null, this.deviceConfig, serviceConfig);

		if(type == 'switch')
		{
			service = new SwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'led')
		{
			service = new LightBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'rgb')
		{
			service = new ColoredBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'contact')
		{
			service = new ContactService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}

		if(service != null)
		{
			this.service.push(service);
		}
    }
};