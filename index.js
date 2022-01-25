let DeviceManager = require('./src/device-manager'), AutomationSystem = require('syntex-automation');

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

		this.username = config['username'];
		this.password = config['password'];
		this.countryCode = this.options['countryCode'];

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

				DeviceManager = new DeviceManager(this.logger, this.tuyaWebAPI);
				AutomationSystem = new AutomationSystem(this.logger, this.files, this, pluginName, this.api.user.storagePath());

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
		this.tuyaWebAPI.getOrRefreshToken().then(function(token) {

			this.tuyaWebAPI.token = token;

			this.tuyaWebAPI.discoverDevices().then(function(devices) {

				for(const device of devices)
				{
					var type = device.dev_type;

					if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer' || (type == 'scene' && this.discoverScenes))
					{
						const homebridgeAccessory = this.getAccessory(device.id);

						this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, { id : device.id, name : device.name, services : type, manufacturer : pluginName }, { platform : this, logger : this.logger, DeviceManager : DeviceManager, AutomationSystem : AutomationSystem, ContextManager : ContextManager }));
					}
				}

				DeviceManager.refreshAccessories(this.accessories);

				if(this.pollingInterval > 0)
				{
					this.refreshInterval = setInterval(() => {

						DeviceManager.refreshAccessories(this.accessories);
		
					}, this.pollingInterval * 1000);
				}

			}.bind(this)).catch((e) => {

				this.logger.err(e);

				setTimeout(() => this.loadAccessories(), 70 * 1000);
			});

		}.bind(this)).catch((e) => {

			this.logger.err(e);

			setTimeout(() => this.loadAccessories(), 70 * 1000);
		});
	}

	initWebServer()
	{
		if(this.port != null)
		{
			this.WebServer.addPage('/reload-automation', async (response) => {

				response.end(await AutomationSystem.LogikEngine.loadAutomation() ? 'Success' : 'Error');
			});
		}
	}
}