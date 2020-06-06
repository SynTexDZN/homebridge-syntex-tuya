var Service, Characteristic;
var logger = require('./logger');
const TuyaWebApi = require('./tuyawebapi');
var tuyaWebAPI;

module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    
    homebridge.registerPlatform('homebridge-syntex-tuya', 'SynTexTuya', SynTexTuyaPlatform);
    homebridge.registerAccessory('homebridge-syntex-tuya', 'SynTexTuyaSwitch', SynTexSwitchAccessory);

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

    //DeviceManager.SETUP(logger, this.cacheDirectory);

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
                    //this.addAccessory(device);
                    if(device.dev_type == 'switch')
                    {
                        var accessory = new SynTexSwitchAccessory(device.id, device.name);

                        accessories.push(accessory);
                    }
                    else if(device.dev_type == 'light')
                    {
                        //var accessory = new SynTexLightAccessory(device.name);

                        //accessories.push(accessory);
                    }

                    logger.log('debug', device);
                }

                this.refreshInterval = setInterval(function() {

                    logger.log('debug', 'Refreshing Tuya States');
    
                    for(var i = 0; i < accessories.length; i++)
                    {
                        updateDeviceState(accessories[i]);
                    }
    
                }, this.pollingInterval * 1000);

                callback(accessories);

            }.bind(this)).catch(function(e) {

                logger.err(e);
            });

        }.bind(this)).catch(function(e) {

            logger.err(e);
        });
    }
}

function updateDeviceState(accessory)
{
    tuyaWebAPI.getDeviceState(accessory.id).then(function(data) {
    
        accessory.changeHandler(data.state);

    }.bind(this)).catch(function(e) {

        logger.err(e);
    });
}

function SynTexSwitchAccessory(id, name)
{
    this.id = id;
    this.name = name;

    this.service = new Service.Switch(this.name);
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
    tuyaWebAPI.getDeviceState(this.id).then(function(data) {

        logger.log('read', "HomeKit Status für '" + this.name + "' ist '" + data.state + "' ( " + this.id + ' )');

        callback(null, data.state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(null);
    });
};

SynTexSwitchAccessory.prototype.setState = function(state, callback, context)
{
    const value = state ? 1 : 0;

    tuyaWebAPI.setDeviceState(this.id, 'turnOnOff', { value: value }).then(function() {

        logger.log('update', "HomeKit Status für '" + this.name + "' geändert zu '" + state + "' ( " + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);
        
        callback();
    });
}

SynTexSwitchAccessory.prototype.getServices = function()
{
    return [this.service];
};