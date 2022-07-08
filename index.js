let DeviceManager = require('./src/device-manager');

const { DynamicPlatform, ContextManager } = require('homebridge-syntex-dynamic-platform');

const SynTexUniversalAccessory = require('./src/universal');
const TuyaWebApi = require('./src/tuya-interface');

const pluginID = 'homebridge-syntex-tuya';
const pluginName = 'SynTexTuya';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexTuyaPlatform, true);

class SynTexTuyaPlatform extends DynamicPlatform
{
	constructor(log, config, api)
	{
		super(config, api, pluginID, pluginName, pluginVersion);

		this.devices = config['accessories'] || [];

		this.username = config['username'];
		this.password = config['password'];
		this.countryCode = config['countryCode'];

		this.platform = this.options['platform'] || 'smart_life';
		this.pollingInterval = this.options['pollingInterval'] == 0 ? 0 : Math.max((this.options['pollingInterval'] || 1030), 1030);

		this.discovery = config['discovery'] || {};

		if(this.api != null && this.logger != null && this.files != null && this.username != null && this.password != null && this.countryCode != null)
		{
			this.api.on('didFinishLaunching', () => {

				this.tuyaWebAPI = new TuyaWebApi(
					this.username,
					this.password,
					this.countryCode,
					this.platform,
					this.logger
				);

				DeviceManager = new DeviceManager(this);

				this.loadAccessories();
			});
		}
		else
		{
			// DEMO
			throw new Error('Minimal parameters not configurated. Please check the README! https://github.com/SynTexDZN/homebridge-syntex-tuya/blob/master/README.md');
		}
	}

	loadAccessories()
	{
		this.tuyaWebAPI.getOrRefreshToken().then((token) => {

			this.tuyaWebAPI.token = token;

			this.tuyaWebAPI.discoverDevices().then((devices) => {

				var additionalConfig = [];

				for(const device of this.devices)
				{
					const homebridgeAccessory = this.getAccessory(device.id);

					device.manufacturer = pluginName;

					this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, DeviceManager, ContextManager }));
				}
				
				for(const device of devices)
				{
					var type = device.dev_type, found = false;

					for(const configDevice of this.devices)
					{
						if(configDevice.id == device.id)
						{
							found = true;
						}

						if(Array.isArray(configDevice.services))
						{
							for(const i in configDevice.services)
							{
								if(configDevice.services[i] instanceof Object && configDevice.services[i].id == device.id)
								{
									found = true;
								}
							}
						}
						else if(configDevice.services instanceof Object && configDevice.services.id == device.id)
						{
							found = true;
						}
					}

					if(!found)
					{
						const homebridgeAccessory = this.getAccessory(device.id);

						if(homebridgeAccessory != null || ((type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer') && this.discovery.addDevices != false) || (type == 'scene' && this.discovery.addScenes != false))
						{
							device.manufacturer = pluginName;
							device.services = type;

							this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, DeviceManager, ContextManager }));
						}

						if(type == 'switch')
						{
							type = 'outlet';
						}
						else if(type == 'light')
						{
							type = 'dimmer';
						}
						else if(type == 'scene')
						{
							type = 'switch';
						}

						additionalConfig.push({ id : device.id, name : device.name, services : [{ type }] });
					}
				}

				DeviceManager.refreshAccessories();

				if(this.pollingInterval > 0)
				{
					this.refreshInterval = setInterval(() => DeviceManager.refreshAccessories(), this.pollingInterval * 1000);
				}

				if(additionalConfig.length > 0 && this.discovery.generateConfig != false)
				{
					this.generateConfig(additionalConfig);
				}

			}).catch((e) => {

				this.logger.err(e);

				setTimeout(() => this.loadAccessories(), 70 * 1000);
			});

		}).catch((e) => {

			this.logger.err(e);

			setTimeout(() => this.loadAccessories(), 70 * 1000);
		});
	}

	generateConfig(additionalConfig)
	{
		this.readConfig().then((data) => {

			if(data != null)
			{
				for(const i in data.platforms)
				{
					if(data.platforms[i].platform == this.pluginName)
					{
						if(data.platforms[i].accessories == null)
						{
							data.platforms[i].accessories = [];
						}

						for(const x in additionalConfig)
						{
							data.platforms[i].accessories.push(additionalConfig[x]);
						}
					}
				}

				this.writeConfig(data).then(() => {});
			}
		});
	}
}