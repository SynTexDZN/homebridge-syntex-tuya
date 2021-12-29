const axios = require('axios'), https = require('https');
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
	constructor(username, password, countryCode, tuyaPlatform = 'tuya', logger)
	{
		this.username = username;
		this.password = password;
		this.countryCode = countryCode;
		this.tuyaPlatform = tuyaPlatform;

		this.session = new Session();

		this.authBaseUrl = 'https://px1.tuyaeu.com';

		this.logger = logger;
	}

	discoverDevices()
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		var data = {
			'header': {
				'name': 'Discovery',
				'namespace': 'discovery',
				'payloadVersion': 1
			},
			'payload': {
				'accessToken': this.session.accessToken
			}
		};

		return new Promise((resolve, reject) => {

			this.sendRequestJson(this.session.areaBaseUrl + '/homeassistant/skill', data, 'GET', (response, obj) => {

				if(obj.header && obj.header.code == 'SUCCESS' && obj.payload && obj.payload.devices)
				{
					resolve(obj.payload.devices);
				}
				else if(obj.header && obj.header.code === 'FrequentlyInvoke')
				{
					reject(new Error('Requesting too quickly! ( ' + JSON.stringify(obj.header.msg) + ' )'));
				}
				else
				{
					reject(new Error('Invalid payload in response: ' + JSON.stringify(obj)))
				}

			}, (error) => {

				reject(error);
			});
		});
	}

	getAllDeviceStates()
	{
		return this.discoverDevices();
	}

	getDeviceState(deviceId)
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		var data = {
			'header': {
				'name': 'QueryDevice',
				'namespace': 'query',
				'payloadVersion': 1
			},
			'payload': {
				'accessToken': this.session.accessToken,
				'devId': deviceId,
				'value': 1
			}
		};

		return new Promise((resolve, reject) => {

			this.sendRequestJson(this.session.areaBaseUrl + '/homeassistant/skill', data, 'GET', (response, obj) => {

				if(obj.header && obj.header.code == 'SUCCESS' && obj.payload && obj.payload.data)
				{
					resolve(obj.payload.data);
				}
				else if(obj.header && obj.header.code === 'FrequentlyInvoke')
				{
					reject();

					this.logger.log('error', deviceId, '', deviceId + ': Requesting too quickly! ( ' + JSON.stringify(obj.header.msg) + ' )');
				}
				else
				{
					reject();

					this.logger.log('error', deviceId, '', 'Invalid payload in response: ' + JSON.stringify(obj));
				}

			}, (error) => {

				reject(error);
			});
		});
	}

	setDeviceState(deviceId, method, payload = {})
	{
		if(!this.session.hasValidToken())
		{
			throw new Error('No valid token');
		}

		/* Methods
		 * turnOnOff -> 0 = off, 1 = on
		 * brightnessSet --> 0..100 
		*/

		var data = {
			'header': {
				'name': method,
				'namespace': 'control',
				'payloadVersion': 1
			},
			'payload': payload
		}

		data.payload.accessToken = this.session.accessToken;
		data.payload.devId = deviceId;

		return new Promise((resolve, reject) => {

			this.sendRequestJson(this.session.areaBaseUrl + '/homeassistant/skill', data, 'POST', (response, obj) => {

				if(obj.header && obj.header.code == 'SUCCESS')
				{
					resolve();
				}
				else if(obj.header && obj.header.code === 'FrequentlyInvoke')
				{
					reject(new Error(deviceId + ': Requesting too quickly! ( ' + JSON.stringify(obj.header.msg) + ' )'));
				}
				else
				{
					reject(new Error('Invalid payload in response: ' + JSON.stringify(obj)))
				}
				
			}, (error) => {

				reject(error);
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
					userName: this.username,
					password: this.password,
					countryCode: this.countryCode,
					bizType: this.tuyaPlatform,
					from: 'tuya',
				};

				const formData = querystring.stringify(form);
				const contentLength = formData.length;

				return new Promise((resolve, reject) => {

					var theRequest = {
						headers : {
							'Content-Length': contentLength,
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						url : this.authBaseUrl + '/homeassistant/auth.do',
						data : formData,
						method : 'POST'
					};

					axios(theRequest).then((response) => {

						let obj = response.data;

						if(obj.responseStatus === 'error')
						{
							reject(new Error('Authentication fault: ' + obj.errorMsg));
						}
						else
						{
							// NOTE: Received token
							this.session.resetToken(obj.access_token, obj.refresh_token, obj.expires_in);
							
							// NOTE: Change url based on areacode in accesstoken first two chars
							this.session.areaCode = 'EU';

							if(obj.access_token)
							{
								this.session.areaCode = obj.access_token.substr(0, 2);
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

					}).catch((err) => reject(new Error('Authentication fault, could not retreive token.' + JSON.stringify(err))));
				});
			}
		}
		else if(this.session.isTokenExpired())
		{
			return new Promise((resolve, reject) => {

				this.sendRequestJson(this.session.areaBaseUrl + '/homeassistant/access.do?grant_type=refresh_token&refresh_token=' + this.session.refreshToken, '', 'GET', (response, obj) => {
						
					this.session.resetToken(obj.access_token, obj.refresh_token, obj.expires_in);

					resolve(this.session);

				}, (error) => {

					reject(error);
				});
			});
		}
	}

	sendRequest(url, body, method, callbackSuccess, callbackError)
	{
		var theRequest = {
			url : url,
			data : body,
			method : method,
			httpsAgent : new https.Agent({ rejectUnauthorized: false })
		};

		axios(theRequest).then((response) => callbackSuccess(response, response.data)).catch((error) => callbackError(error));
	}

	sendRequestJson(url, body, method, callbackSuccess, callbackError)
	{
		this.sendRequest(url, body, method, (response, body) => callbackSuccess(response, body), (error) => callbackError(error));
	}
}