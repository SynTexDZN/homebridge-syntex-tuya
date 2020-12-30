let DeviceManager = require('./device-manager');

const { DynamicPlatform } = require('homebridge-syntex-dynamic-platform');

const SynTexUniversalAccessory = require('./src/universal');
const TuyaWebApi = require('./tuyawebapi');

const pluginID = 'homebridge-syntex-tuya';
const pluginName = 'SynTexTuya';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexTuyaPlatform, true);

class SynTexTuyaPlatform extends DynamicPlatform
{
	constructor(log, config, api)
	{
		super(config, api, pluginID, pluginName, pluginVersion);

		if(config.options != null)
		{
			this.username = config.options['username'];
			this.password = config.options['password'];
			this.countryCode = config.options['countryCode'] || '49';
			this.platform = config.options['platform'] || 'smart_life';
			this.polling_interval = config.options['polling_interval'] == 0 ? 0 : Math.max((config.options['polling_interval'] || 610), 610);
			this.discover_scenes = config.options['discover_scenes'] || false;
		}

		if(this.api && this.logger)
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

				this.loadAccessories();

				this.finishInit();
			});
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

					if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer' || type == 'scene')
					{
						const homebridgeAccessory = this.getAccessory(device.id);

						this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, { id : device.id, name : device.name, services : type, manufacturer : this.manufacturer, model : this.model, version : this.version }, { platform : this, logger : this.logger, DeviceManager : DeviceManager }));
					}
				}

				DeviceManager.refreshAccessories(this.accessories);

				if(this.polling_interval != 0)
				{
					this.refreshInterval = setInterval(() => {

						DeviceManager.refreshAccessories(this.accessories);
		
					}, this.polling_interval * 1000);
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
}