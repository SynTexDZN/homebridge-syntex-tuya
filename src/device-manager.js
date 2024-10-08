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

	refreshAccessories(devices)
	{
		return new Promise((resolve) => {

			for(const device of devices)
			{
				try
				{
					var state = {};

					if(device.data.state != null)
					{
						state.value = JSON.parse(device.data.state);
					}

					if(device.dev_type == 'cover' && state.value != null)
					{
						if(state.value == 3)
						{
							delete state.value;
						}
						else
						{
							state.value = state.target = state.value == 2 ? 0 : 100;
						}
					}

					if(device.data.brightness != null && device.data.color_mode == 'white')
					{
						state.brightness = JSON.parse(device.data.brightness);

						if(state.brightness != null)
						{
							var tuyaStart = 25, tuyaEnd = 255, homekitStart = 1, homekitEnd = 100;

							state.brightness = Math.round(((state.brightness - tuyaStart) * (homekitEnd - homekitStart)) / (tuyaEnd - tuyaStart) + homekitStart);
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

			resolve();
		});
	}

	getState(service)
	{
		return new Promise((callback) => {

			var state = {};

			if(this.tuyaWebAPI.session.hasValidToken())
			{
				if(this.runningRequests[service.sid] == null)
				{
					this.runningRequests[service.sid] = new Promise((resolve) => this.tuyaWebAPI.getDeviceState(service).then((data) => {
	
						try
						{
							if(data.state != null && this.TypeManager.getCharacteristic('value', { letters : service.letters }) != null)
							{
								state.value = JSON.parse(data.state);
							}
	
							if(this.TypeManager.letterToType(service.letters) == 'blind' && state.value != null)
							{
								if(state.value == 3)
								{
									delete state.value;
								}
								else
								{
									state.value = state.target = state.value == 2 ? 0 : 100;
								}
							}
	
							if(data.brightness != null && this.TypeManager.getCharacteristic('brightness', { letters : service.letters }) != null && data.color_mode == 'white')
							{
								state.brightness = JSON.parse(data.brightness);
	
								if(state.brightness != null)
								{
									var tuyaStart = 25, tuyaEnd = 255, homekitStart = 1, homekitEnd = 100;
	
									state.brightness = Math.round(((state.brightness - tuyaStart) * (homekitEnd - homekitStart)) / (tuyaEnd - tuyaStart) + homekitStart);
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
								state.connection = data.online;
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
				});
			}
			else
			{
				callback(state);
			}
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			if(this.tuyaWebAPI.session.hasValidToken())
			{
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
			}
			else
			{
				resolve(false);
			}
		});
	}

	setBrightness(service, brightness)
	{
		return new Promise((resolve) => {

			if(this.tuyaWebAPI.session.hasValidToken())
			{
				var value = brightness, homekitStart = 1, homekitEnd = 100, tuyaStart = service.min, tuyaEnd = service.max;

				if(value <= homekitStart)
				{
					value++;
				}

				value = ((value - homekitStart) * (tuyaEnd - tuyaStart)) / (homekitEnd - homekitStart) + tuyaStart;

				this.tuyaWebAPI.setDeviceState(service, 'brightnessSet', { value }).then(() => {

					this.EventManager.setOutputStream('updateState', { sender : service, receiver : service.sid }, { brightness });

					resolve(true);
			
				}).catch((e) => {
			
					if(e != null)
					{
						this.logger.err(e);
					}
			
					resolve(false);
				});
			}
			else
			{
				resolve(false);
			}
		});
	}

	setTargetPosition(service, target)
	{
		return new Promise((resolve) => {

			if(this.tuyaWebAPI.session.hasValidToken())
			{
				var method = target == 50 ? 'startStop' : 'turnOnOff',
					payload = { value : target > 50 ? 1 : 0 };

				this.tuyaWebAPI.setDeviceState(service, method, payload).then(() => {

					this.EventManager.setOutputStream('updateState', { sender : service, receiver : service.sid }, { value : target, target });

					resolve(true);
			
				}).catch((e) => {
			
					if(e != null)
					{
						this.logger.err(e);
					}

					resolve(false);
				});
			}
			else
			{
				resolve(false);
			}
		});
	}
}