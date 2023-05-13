const querystring = require('querystring');

// TODO: Translate All Errors

class Session
{
	constructor(accessToken, refreshToken, expiresIn, areaCode, areaBaseUrl)
	{
		this.accessToken;
		this.refreshToken;
		this.expiresOn;
		this.areaCode = areaCode;
		this.areaBaseUrl = areaBaseUrl;
		this.resetToken(accessToken, refreshToken, expiresIn);
	}

	resetToken(accessToken, refreshToken, expiresIn)
	{
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresOn = this.getCurrentEpoch() + expiresIn - 100; // subtract 100 ticks to expire token before it actually does
	}

	hasToken()
	{
		return this.accessToken && true;
	}

	isTokenExpired()
	{
		return this.expiresOn < this.getCurrentEpoch();
	}

	hasValidToken()
	{
		return this.hasToken() && !this.isTokenExpired();
	}

	getCurrentEpoch()
	{
		return Math.round((new Date()).getTime() / 1000);
	}
}

module.exports = class TuyaWebApi
{
	constructor(platform)
	{
		this.logger = platform.logger;

		this.username = platform.username;
		this.password = platform.password;
		this.countryCode = platform.countryCode;
		this.tuyaPlatform = platform.tuyaPlatform;

		this.RequestManager = platform.RequestManager;

		this.session = new Session();

		this.authBaseUrl = 'https://px1.tuyaeu.com';
	}

	discoverDevices()
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		var body = {
			header : {
				name : 'Discovery',
				namespace : 'discovery',
				payloadVersion : 1
			},
			payload : {
				accessToken : this.session.accessToken
			}
		};

		return new Promise((resolve, reject) => {

			this.sendRequest(this.session.areaBaseUrl + '/homeassistant/skill', { body }, (data) => {

				if(data != null && data.header != null && data.header.code == 'SUCCESS' && data.payload != null && data.payload.devices != null)
				{
					resolve(data.payload.devices);
				}
				else
				{
					if(data != null)
					{
						if(data.header != null && data.header.code === 'FrequentlyInvoke')
						{
							this.logger.log('error', 'bridge', 'Bridge', '%device_discovery% %frequently_invoke%! %query_once%: ' + JSON.stringify(data.header.msg).split('once in ')[1].split(' seconds')[0] + 's');
						}
						else
						{
							this.logger.log('error', 'bridge', 'Bridge', '%device_discovery% %invalid_response%! ( ' + JSON.stringify(data) + ' )');
						}
					}

					reject();
				}
			});
		});
	}

	getDeviceState(service)
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		var body = {
			header : {
				name : 'QueryDevice',
				namespace : 'query',
				payloadVersion : 1
			},
			payload : {
				accessToken : this.session.accessToken,
				devId : service.sid,
				value : 1
			}
		};

		return new Promise((resolve, reject) => {

			this.sendRequest(this.session.areaBaseUrl + '/homeassistant/skill', { body }, (data) => {

				if(data != null && data.header != null && data.header.code == 'SUCCESS' && data.payload != null && data.payload.data != null)
				{
					resolve(data.payload.data);
				}
				else
				{
					if(data != null)
					{
						if(data.header != null && data.header.code === 'FrequentlyInvoke')
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %frequently_invoke%! %query_once%: ' + JSON.stringify(data.header.msg).split('once in ')[1].split(' seconds')[0] + 's ( ' + service.sid + ' )');
						}
						else
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %invalid_response%! ( ' + JSON.stringify(data) + ' )');
						}
					}
				
					reject();
				}
			});
		});
	}

	setDeviceState(service, method, payload = {})
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		/* Methods
		 * turnOnOff -> 0 = off, 1 = on
		 * brightnessSet --> 0..100 
		*/

		var body = {
			header : {
				name : method,
				namespace : 'control',
				payloadVersion : 1
			},
			payload : payload
		}

		body.payload.accessToken = this.session.accessToken;
		body.payload.devId = service.sid;

		return new Promise((resolve, reject) => {

			this.sendRequest(this.session.areaBaseUrl + '/homeassistant/skill', { body }, (data) => {

				if(data != null && data.header != null && data.header.code == 'SUCCESS')
				{
					service.setConnectionState(true, () => resolve(), true);
				}
				else
				{
					if(data != null)
					{
						if(data.header != null && data.header.code === 'TargetOffline')
						{
							service.setConnectionState(false, () => {}, true);

							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %accessory_offline%! ( ' + service.sid + ' )');
						}
						else if(data.header != null && data.header.code === 'FrequentlyInvoke')
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %frequently_invoke%! %query_once%: ' + JSON.stringify(data.header.msg).split('once in ')[1].split(' seconds')[0] + 's ( ' + service.sid + ' )');
						}
						else
						{
							this.logger.log('error', service.id, service.letters, '[' + service.name + '] %invalid_response%! ( ' + JSON.stringify(data) + ' )');
						}
					}

					reject();
				}
			});
		});
	}

	getOrRefreshToken()
	{
		if(!this.session.hasToken())
		{
			if(!this.username)
			{
				throw new Error('No username configured');
			}
			
			if(!this.password)
			{
				throw new Error('No password configured');
			}

			if(this.username && this.password && this.countryCode)
			{
				const form = {
					userName : this.username,
					password : this.password,
					countryCode : this.countryCode,
					bizType : this.tuyaPlatform,
					from : 'tuya',
				};

				const formData = querystring.stringify(form);
				const contentLength = formData.length;

				return new Promise((resolve, reject) => {

					var options = {
						headers : {
							'Content-Length' : contentLength,
							'Content-Type' : 'application/x-www-form-urlencoded'
						},
						data : formData,
						method : 'POST'
					};

					this.RequestManager.fetch(this.authBaseUrl + '/homeassistant/auth.do', options).then((data, err) => {

						if(data != null)
						{
							if(data.responseStatus === 'error')
							{
								reject(new Error('Authentication fault: ' + data.errorMsg));
							}
							else
							{
								// NOTE: Received token
								this.session.resetToken(data.access_token, data.refresh_token, data.expires_in);
								
								// NOTE: Change url based on areacode in accesstoken first two chars
								this.session.areaCode = 'EU';

								if(data.access_token)
								{
									this.session.areaCode = data.access_token.substr(0, 2);
								}

								switch(this.session.areaCode)
								{
									case 'AY':
										this.session.areaBaseUrl = 'https://px1.tuyacn.com';
										break;
									case 'EU':
										this.session.areaBaseUrl = 'https://px1.tuyaeu.com';
										break;
									case 'US':
									default:
										this.session.areaBaseUrl = 'https://px1.tuyaus.com';
								}

								resolve(this.session);
							}
						}
						else
						{
							reject(new Error('Authentication fault, could not retreive token.' + JSON.stringify(err)));
						}
					});
				});
			}
		}
		else if(this.session.isTokenExpired())
		{
			return new Promise((resolve, reject) => {

				this.sendRequest(this.session.areaBaseUrl + '/homeassistant/access.do?grant_type=refresh_token&refresh_token=' + this.session.refreshToken, '', 'GET', (data) => {
					
					if(data != null)
					{
						this.session.resetToken(data.access_token, data.refresh_token, data.expires_in);

						resolve(this.session);
					}
					else
					{
						reject();
					}
				});
			});
		}
	}

	sendRequest(url, options, callback)
	{
		this.RequestManager.fetch(url, { data : options.body, verbose : true }).then((data) => {
			
			if(callback != null)
			{
				callback(data);
			}
		});
	}
}