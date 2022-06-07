module.exports = class DeviceManager
{
	constructor(platform)
	{
		this.logger = platform.logger;
		this.tuyaWebAPI = platform.tuyaWebAPI;
		this.TypeManager = platform.TypeManager;
		this.EventManager = platform.EventManager;

		this.runningRequests = {};
	}

	refreshAccessories(accessories)
	{
		this.logger.debug('%device_refresh% ..');

		return new Promise(resolve => {

			this.tuyaWebAPI.getAllDeviceStates().then((devices) => {

				for(const device of devices)
				{
					var state = {};

					try
					{
						if(device.data.state != null)
						{
							state.value = JSON.parse(device.data.state);
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

						if(Object.keys(state).length == 0)
						{
							state = null;
						}
					}
					catch(e)
					{
						state = null;

						this.logger.err(e);
					}

					if(state != null)
					{
						this.EventManager.setOutputStream('SynTexTuya', null, device.id, state);
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
		return new Promise((callback) => {

			if(this.runningRequests[service.id] == null)
			{
				this.runningRequests[service.id] = new Promise((resolve) => this.tuyaWebAPI.getDeviceState(service.id).then((data) => {

					try
					{
						var state = {};
						
						if(data.state != null)
						{
							state.value = JSON.parse(data.state);
						}

						if(data.brightness != null)
						{
							state.brightness = JSON.parse(data.brightness);

							if(data.color_mode == 'white')
							{
								state.brightness /= 2.55;
							}
							else if(data.color_mode == 'colour')
							{
								state.brightness /= 5;
							}
						}
	
						if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null)
						{
							if(state.value != null)
							{
								service.value = state.value;
							}

							if(state.brightness != null)
							{
								service.brightness = state.brightness;
							}

							resolve(state);
						}
						else
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %update_error%! ( ' + service.id + ' )');
						
							resolve(null);
						}
					}
					catch(e)
					{
						this.logger.err(e);

						resolve(null);
					}

				}).catch((e) => {
			
					if(e != null)
					{
						this.logger.err(e);
					}

					resolve(null);
				}));
			}
			
			this.runningRequests[service.id].then((state) => {
				
				delete this.runningRequests[service.id]

				callback(state);
			});
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service.id, 'turnOnOff', { value : value ? 1 : 0 }).then(() => {

				this.EventManager.setOutputStream('SynTexTuya', service, service.id, { value });

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);

				resolve(false);
			});
		});
	}

	setBrightness(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service.id, 'brightnessSet', { value }).then(() => {

				this.EventManager.setOutputStream('SynTexTuya', service, service.id, { brightness : value });

				resolve(true);
		
			}).catch((e) => {
		
				this.logger.err(e);
		
				resolve(false);
			});
		});
	}
}