const TypeManager = require('./type-manager');

module.exports = class DeviceManager
{
	constructor(logger, tuyaWebAPI)
	{
		this.logger = logger;
		this.tuyaWebAPI = tuyaWebAPI;

		this.TypeManager = new TypeManager(this.logger);
	}

	refreshAccessories(accessories)
	{
		this.logger.debug('%device_refresh% ..');

		return new Promise(resolve => {

			this.tuyaWebAPI.getAllDeviceStates().then((devices) => {

				for(const device of devices)
				{
					var type = device.dev_type;

					if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer')
					{
						var state = {};

						try
						{
							if(device.data.state != null)
							{
								state.power = JSON.parse(device.data.state);
							}

							if(device.data.brightness != null)
							{
								state.brightness = JSON.parse(device.data.brightness);

								if(device.data.color_mode == 'white')
								{
									state.brightness /= 2.55;
								}
								else if(device.data.color_mode == 'colour')
								{
									state.brightness /= 5;
								}
							}
						}
						catch(e)
						{
							state = null;

							this.logger.err(e);
						}

						for(const accessory of accessories)
						{
							if(accessory[1].id == device.id)
							{
								if((state = this.TypeManager.validateUpdate(accessory[1].id, accessory[1].service[1].letters, state)) != null)
								{
									accessory[1].service[1].updateState(state);
								}
								else
								{
									this.logger.log('error', accessory[1].id, accessory[1].service[1].letters, '[' + accessory[1].name + '] %update_error%! ( ' + accessory[1].id + ' )');
								}
							}
						}
					}
				}

				resolve(true);

			}).catch((e) => {

				this.logger.err(e);

				resolve(false);
			});
		});
	}

	getState(service)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.getDeviceState(service.id).then((data) => {
				
				try
				{
					var state = { power : JSON.parse(data.state) };

					if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null)
					{
						service.updateState(state);
					}
					else
					{
						this.logger.log('error', service.id, service.letters, '[' + service.name + '] %update_error%! ( ' + service.id + ' )');
					}

					resolve(state?.power);
				}
				catch(e)
				{
					this.logger.err(e);

					resolve(null);
				}

			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(null);
			});
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service.id, 'turnOnOff', { value : value ? 1 : 0 }).then(() => {

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);

				resolve(false);
			});
		});
	}

	getBrightness(service)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.getDeviceState(service.id).then((data) => {
				
				try
				{
					var state = { brightness : JSON.parse(data.brightness) };

					if(data.color_mode == 'white')
					{
						state.brightness /= 2.55;
					}
					else if(data.color_mode == 'colour')
					{
						state.brightness /= 5;
					}

					if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null)
					{
						service.updateState(state);
					}
					else
					{
						this.logger.log('error', service.id, service.letters, '[' + service.name + '] %update_error%! ( ' + service.id + ' )');
					}

					resolve(state?.brightness);
				}
				catch(e)
				{
					this.logger.err(e);

					resolve(null);
				}
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(null);
			});
		});
	}

	setBrightness(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service.id, 'brightnessSet', { value }).then(() => {

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(false);
			});
		});
	}
}