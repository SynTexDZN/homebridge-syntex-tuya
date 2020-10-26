var Service, Characteristic;
var logger = require('./logger');
const TuyaWebApi = require('./tuyawebapi');
var DeviceManager = require('./device-manager');
var WebServer = require('./webserver');
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
    this.port = sconfig['port'] || 1713;
    
    logger = new logger('SynTexTuya', this.logDirectory, api.user.storagePath());
    WebServer = new WebServer('SynTexTuya', logger, this.port);

    this.api = api;

    tuyaWebAPI = new TuyaWebApi(
        this.username,
        this.password,
        this.countryCode,
        this.platform,
        logger
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

                    DeviceManager.refreshAccessories(accessories);
    
                }, this.pollingInterval * 1000);

                DeviceManager.refreshAccessories(accessories);

                callback(accessories);

                WebServer.addPage('/devices', async (response, urlParams) => {
	
                    if(urlParams.id != null)
                    {
                        var accessory = null;
            
                        for(var i = 0; i < accessories.length; i++)
                        {
                            if(accessories[i].id == urlParams.id)
                            {
                                accessory = accessories[i];
                            }
                        }
            
                        if(accessory == null)
                        {
                            logger.log('error', urlParams.id, '', 'Es wurde kein passendes Gerät in der Config gefunden! ( ' + urlParams.id + ' )');
            
                            response.write('Error');
                        }
                        else if(urlParams.value != null)
                        {
                            accessory.changeHandler(state);
            
                            DeviceManager.setDevice(urlParams.id, urlParams.value); // TODO : Concat RGB Light Services
                                
                            response.write(state != null ? 'Success' : 'Error');
                        }
                        else
                        {
                            var state = await DeviceManager.getDevice(urlParams.id);
            
                            response.write(state != null ? state.toString() : 'Error');
                        }
                    }
                    else
                    {
                        response.write('Error');
                    }
            
                    response.end();
                });

                WebServer.addPage('/accessories', (response, urlParams) => {

                    var a = [];

                    for(var i = 0; i < accessories.length; i++)
                    {
                        a[i] = {
                            mac: accessories[i].id,
                            name: accessories[i].name,
                            services: accessories[i].services,
                            version: '99.99.99'
                        };
                    }

                    response.write(JSON.stringify(a));
                    response.end();
                });

                WebServer.addPage('/version', (response, urlParams) => {

                    response.write(require('./package.json').version);
                    response.end();
                });
        
                WebServer.addPage('/check-restart', (response, urlParams) => {
        
                    response.write(restart.toString());
                    response.end();
                });
        
                WebServer.addPage('/update', async (response, urlParams) => {
        
                    var version = urlParams.version ? urlParams.version : 'latest';
        
                    const { exec } = require('child_process');
                    
                    exec('sudo npm install homebridge-syntex-tuya@' + version + ' -g', (error, stdout, stderr) => {
        
                        try
                        {
                            if(error || stderr.includes('ERR!'))
                            {
                                logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge konnte nicht aktualisiert werden! ' + (error || stderr));
                            }
                            else
                            {
                                logger.log('success', 'bridge', 'Bridge', 'Die Homebridge wurde auf die Version [' + version + '] aktualisiert!');
        
                                restart = true;
        
                                logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
        
                                exec('sudo systemctl restart homebridge');
                            }
        
                            response.write(error || stderr.includes('ERR!') ? 'Error' : 'Success');
                            response.end();
                        }
                        catch(e)
                        {
                            logger.err(e);
                        }
                    });
                });

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
    this.services = 'switch';

    this.service = new Service.Outlet(this.name);
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);
    
    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
}

SynTexSwitchAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.name, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        /*
        if(!data.online)
        {
            callback(new Error('Offline'));
        }
        */
        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSwitchAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
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
    this.services = 'led';

    this.service = new Service.Lightbulb(this.name);
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

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
    this.services = 'television';

    this.service = new Service.Television(this.name, 'tvService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.Active).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));

    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
}

SynTexTVAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.name, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        /*
        if(!data.online)
        {
            callback(new Error('Offline'));
        }
        */
        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexTVAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
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
    this.services = 'speaker';

    this.service = new Service.Speaker(this.name, 'tvSpeakerService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
    this.service.setCharacteristic(Characteristic.Mute, false);
    this.service.setCharacteristic(Characteristic.Volume, 100);
}

SynTexSpeakerAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.name, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        /*
        if(!data.online)
        {
            callback(new Error('Offline'));
        }
        */
        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSpeakerAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.name, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
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