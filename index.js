var Service, Characteristic;
var logger = require('./logger');
const TuyaWebApi = require('./tuyawebapi');
var DeviceManager = require('./device-manager');
var tuyaWebAPI;

module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    
    homebridge.registerPlatform('homebridge-syntex-tuya', 'SynTexTuya', SynTexTuyaPlatform);
    //homebridge.registerAccessory('homebridge-syntex-tuya', 'SynTexTuyaSwitch', SynTexSwitchAccessory);

    /*
    homebridge.registerAccessory('homebridge-syntex-webhooks', 'SynTexWebHookSensor', SynTexWebHookSensorAccessory);
    homebridge.registerAccessory('homebridge-syntex-webhooks', 'SynTexWebHookSwitch', SynTexWebHookSwitchAccessory);
    homebridge.registerAccessory('homebridge-syntex-webhooks', 'SynTexWebHookStripeRGB', SynTexWebHookStripeRGBAccessory);
    homebridge.registerAccessory('homebridge-syntex-webhooks', 'SynTexWebHookStatelessSwitch', SynTexWebHookStatelessSwitchAccessory);
    */
};

function SynTexTuyaPlatform(log, sconfig, api)
{
    this.username = sconfig['username'];
    this.password = sconfig['password'];
    this.countryCode = sconfig['countryCode'] || '49';
    this.platform = sconfig['plat'] || 'smart_life';
    this.pollingInterval = sconfig['pollingInterval'] || 10;
    this.defaults = sconfig['defaults'] || [];
    
    this.cacheDirectory = sconfig['cache_directory'] || './SynTex';
    this.logDirectory = sconfig['log_directory'] || './SynTex/log';
    this.port = sconfig['port'] || 1712;
    
    logger.create('SynTexTuya', this.logDirectory, api.user.storagePath());

    this.api = api;

    tuyaWebAPI = new TuyaWebApi(
        this.username,
        this.password,
        this.countryCode,
        this.platform
    );

    DeviceManager.SETUP(logger, tuyaWebAPI);

    restart = false;
}

SynTexTuyaPlatform.prototype = {
    
    accessories : function(callback)
    {
        tuyaWebAPI.getOrRefreshToken().then(function(token) {

            tuyaWebAPI.token = token;

            tuyaWebAPI.discoverDevices().then(function(devices) {
                
                var accessories = [];

                for(const device of devices)
                {
                    if(device.dev_type == 'switch')
                    {
                        var accessory = null;

                        for(var i = 0; i < this.defaults.length; i++)
                        {
                            if(this.defaults[i].id == device.id)
                            {
                                if(this.defaults[i].type == 'TV')
                                {
                                    accessory = new SynTexTVAccessory(device.id, device.name);
                                }
                                else if(this.defaults[i].type == 'Speaker')
                                {
                                    accessory = new SynTexSpeakerAccessory(device.id, device.name);
                                }
                            }
                        }

                        if(accessory == null)
                        {
                            accessory = new SynTexSwitchAccessory(device.id, device.name);
                        }

                        accessories.push(accessory);
                    }
                    else if(device.dev_type == 'light')
                    {
                        var accessory = new SynTexLightAccessory(device.id, device.name);

                        accessories.push(accessory);
                    }
                }

                this.refreshInterval = setInterval(function() {

                    logger.log('debug', 'Refreshing Tuya States');
    
                    for(var i = 0; i < accessories.length; i++)
                    {
                        DeviceManager.refreshAccessory(accessories[i]);
                    }
    
                }, this.pollingInterval * 1000);

                for(var i = 0; i < accessories.length; i++)
                {
                    DeviceManager.refreshAccessory(accessories[i]);
                }

                callback(accessories);

            }.bind(this)).catch(function(e) {

                logger.err(e);
            });

        }.bind(this)).catch(function(e) {

            logger.err(e);
        });
    }
}

function SynTexSwitchAccessory(id, name)
{
    this.id = id;
    this.name = name;

    this.service = new Service.Outlet(this.name);
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(newState)
    {
        this.service.getCharacteristic(Characteristic.On).updateValue(newState);

    }).bind(this);
    
    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
}

SynTexSwitchAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(data) {

        if(data == null)
        {
            logger.log('error', 'Es wurde kein passendes Gerät in der Storage gefunden! ( ' + this.id + ' )');

            callback(null, null);
        }
        else
        {
            if(!data.online)
            {
                callback(new Error('Offline'));
            }

            logger.log('read', "HomeKit Status für '" + this.name + "' ist '" + data.state + "' ( " + this.id + ' )');

            callback(null, data.state);
        }

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSwitchAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, value).then(function() {

        logger.log('update', "HomeKit Status für '" + this.name + "' geändert zu '" + state + "' ( " + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexSwitchAccessory.prototype.getServices = function()
{
    return [this.service];
};

function SynTexLightAccessory(id, name)
{
    this.id = id;
    this.name = name;

    this.service = new Service.Lightbulb(this.name);
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(newState)
    {
        this.service.getCharacteristic(Characteristic.On).updateValue(newState);

    }).bind(this);
    
    //this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
}

SynTexLightAccessory.prototype.getServices = function()
{
    return [this.service];
};

function SynTexTVAccessory(id, name)
{
    this.id = id;
    this.name = name;

    this.service = new Service.Television(this.name, 'tvService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(newState)
    {
        this.service.getCharacteristic(Characteristic.On).updateValue(newState);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.Active).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));

    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
}

SynTexTVAccessory.prototype.getState = function(callback)
{
    tuyaWebAPI.getDeviceState(this.id).then(function(data) {

        if(!data.online)
        {
            callback(new Error('Offline'));
        }

        logger.log('read', "HomeKit Status für '" + this.name + "' ist '" + data.state + "' ( " + this.id + ' )');

        callback(null, data.state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexTVAccessory.prototype.setState = function(state, callback)
{
    const value = state ? 1 : 0;

    tuyaWebAPI.setDeviceState(this.id, 'turnOnOff', { value: value }).then(function() {

        logger.log('update', "HomeKit Status für '" + this.name + "' geändert zu '" + state + "' ( " + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexTVAccessory.prototype.getServices = function()
{
    return [this.service];
};

function SynTexSpeakerAccessory(id, name)
{
    this.id = id;
    this.name = name;

    this.service = new Service.Speaker(this.name, 'tvSpeakerService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(newState)
    {
        this.service.getCharacteristic(Characteristic.On).updateValue(newState);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
    this.service.setCharacteristic(Characteristic.Mute, false);
    this.service.setCharacteristic(Characteristic.Volume, 100);
}

SynTexSpeakerAccessory.prototype.getState = function(callback)
{
    tuyaWebAPI.getDeviceState(this.id).then(function(data) {

        if(!data.online)
        {
            callback(new Error('Offline'));
        }

        logger.log('read', "HomeKit Status für '" + this.name + "' ist '" + data.state + "' ( " + this.id + ' )');

        callback(null, data.state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSpeakerAccessory.prototype.setState = function(state, callback)
{
    const value = state ? 1 : 0;

    tuyaWebAPI.setDeviceState(this.id, 'turnOnOff', { value: value }).then(function() {

        logger.log('update', "HomeKit Status für '" + this.name + "' geändert zu '" + state + "' ( " + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexSpeakerAccessory.prototype.getServices = function()
{
    return [this.service];
};