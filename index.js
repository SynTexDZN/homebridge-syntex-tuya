let DeviceManager = require('./src/device-manager'), TypeManager = require('./src/type-manager');

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
		this.pollingInterval = this.options['pollingInterval'] == 0 ? 0 : Math.max((this.options['pollingInterval'] || 610), 610);
		this.discoverScenes = this.options['discoverScenes'] || false;

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

				this.TypeManager = new TypeManager(this.logger);

				DeviceManager = new DeviceManager(this);

				this.loadAccessories();
				this.initWebServer();
			});
		}
		else
		{
			throw new Error('Minimal parameters not configurated. Please check the README! https://github.com/SynTexDZN/homebridge-syntex-tuya/blob/master/README.md');
		}
	}

	loadAccessories()
	{
		for(const device of this.devices)
		{
			const homebridgeAccessory = this.getAccessory(device.id);

			device.manufacturer = pluginName;

			this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, DeviceManager, ContextManager }));
		}

		this.tuyaWebAPI.getOrRefreshToken().then((token) => {

			this.tuyaWebAPI.token = token;

			this.tuyaWebAPI.discoverDevices().then((devices) => {

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
						if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer' || (type == 'scene' && this.discoverScenes))
						{
							const homebridgeAccessory = this.getAccessory(device.id);

							device.manufacturer = pluginName;
							device.services = type;

							this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, DeviceManager, ContextManager }));
						}
					}
				}

				DeviceManager.refreshAccessories();

				if(this.pollingInterval > 0)
				{
					this.refreshInterval = setInterval(() => DeviceManager.refreshAccessories(), this.pollingInterval * 1000);
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

	initWebServer()
	{
		if(this.port != null)
		{
			this.WebServer.addPage('/reload-automation', async (response) => {

				response.end(await this.AutomationSystem.LogikEngine.loadAutomation() ? 'Success' : 'Error');
			});
		}
	}
}