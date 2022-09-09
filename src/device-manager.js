module.exports = class DeviceManager
{
	constructor(platform)
	{
		this.runningRequests = {};

		this.logger = platform.logger;
		this.tuyaWebAPI = platform.tuyaWebAPI;
		this.TypeManager = platform.TypeManager;
		this.EventManager = platform.EventManager;
	}

	refreshAccessories()
	{
		this.logger.debug('%device_refresh% ..');

		return new Promise(resolve => {

			this.tuyaWebAPI.getAllDeviceStates().then((devices) => {

				for(const device of devices)
				{
					try
					{
						var state = {};

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

						if(device.data.online != null)
						{
							state.connection = device.data.online;
						}

						if(Object.keys(state).length > 0)
						{
							this.EventManager.setOutputStream('updateState', { receiver : device.id }, state);
						}
					}
					catch(e)
					{
						this.logger.err(e);
					}
				}

				resolve(true);

			}).catch((e) => {

				if(e != null)
				{
					this.logger.err(e);
				}

				resolve(false);
			});
		});
	}

	getState(service)
	{
		return new Promise((callback) => {

			var state = {};
			
			if(this.runningRequests[service.sid] == null)
			{
				this.runningRequests[service.sid] = new Promise((resolve) => this.tuyaWebAPI.getDeviceState(service).then((data) => {

					try
					{
						if(data.state != null && this.TypeManager.getCharacteristic('value', { letters : service.letters }) != null)
						{
							state.value = JSON.parse(data.state);
						}

						if(data.brightness != null && this.TypeManager.getCharacteristic('brightness', { letters : service.letters }) != null)
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
						}
						else
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %update_error%! ( ' + service.id + ' )');
						}

						if(data.online != null)
						{
							service.setConnectionState(data.online, null, true);
						}
					}
					catch(e)
					{
						this.logger.err(e);
					}

					resolve(state);

				}).catch((e) => {
			
					if(e != null)
					{
						this.logger.err(e);
					}

					resolve(state);
				}));
			}
			
			this.runningRequests[service.sid].then((state) => {
				
				delete this.runningRequests[service.sid];

				callback(state);

			}).catch(() => {

				callback(state);
			});
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service, 'turnOnOff', { value : value ? 1 : 0 }).then(() => {

				this.EventManager.setOutputStream('updateState', { sender : service, receiver : service.sid }, { value });

				resolve(true);
		
			}).catch((e) => {
		
				if(e != null)
				{
					this.logger.err(e);
				}

				resolve(false);
			});
		});
	}

	setBrightness(service, value)
	{
		return new Promise((resolve) => {

			this.tuyaWebAPI.setDeviceState(service, 'brightnessSet', { value }).then(() => {

				this.EventManager.setOutputStream('updateState', { sender : service, receiver : service.sid }, { brightness : value });

				resolve(true);
		
			}).catch((e) => {
		
				if(e != null)
				{
					this.logger.err(e);
				}
		
				resolve(false);
			});
		});
	}
}