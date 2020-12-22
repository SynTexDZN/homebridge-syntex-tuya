module.exports = class DeviceManager
{
	constructor(logger, tuyaWebAPI)
	{
		this.logger = logger;
		this.tuyaWebAPI = tuyaWebAPI;
	}

	refreshAccessories(accessories)
	{
		this.logger.debug('Geräte Status aktualisieren ..');

		return new Promise(resolve => {

			this.tuyaWebAPI.getAllDeviceStates().then((devices) => {

				for(const device of devices)
				{
					var type = device.dev_type;

					if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer')
					{
						var state = { power : device.data.state };

						try
						{
							if(device.data.state != null)
							{
								state.power = JSON.parse(device.data.state);
							}

							if(device.data.brightness != null)
							{
								if(device.data.color_mode == 'white')
								{
									state.brightness = JSON.parse(device.data.brightness) / 2.55;
								}
								else if(device.data.color_mode == 'colour')
								{
									state.brightness = JSON.parse(device.data.brightness) / 5;
								}
								else
								{
									state.brightness = JSON.parse(device.data.brightness);
								}
							}
						}
						catch(e)
						{
							this.logger.err(e);
						}

						for(const accessory of accessories)
						{
							if(accessory[1].id == device.id)
							{
								accessory[1].service[1].updateState(state);
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

	getState(id)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.getDeviceState(id).then((data) => {
				
				resolve(data != null ? JSON.parse(data.state) : null);
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(null);
			});
		});
	}

	getBrightness(id)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.getDeviceState(id).then((data) => {
				
				resolve(data != null ? JSON.parse(data.brightness) / 2.55 : null);
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(null);
			});
		});
	}

	setState(id, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value : value ? 1 : 0 }).then(() => {

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);

				resolve(false);
			});
		});
	}

	setBrightness(id, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(id, 'brightnessSet', { value : value }).then(() => {

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(false);
			});
		});
	}
}