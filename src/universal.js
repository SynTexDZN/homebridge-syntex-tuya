const { UniversalAccessory } = require('homebridge-syntex-dynamic-platform');
const OutletService = require('./accessories/outlet');
const DimmedBulbService = require('./accessories/dimmer');

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

		if(type == 'switch' || type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'light')
		{
			serviceConfig.type = 'dimmer';

			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
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