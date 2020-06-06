var Service, Characteristic;
var request = require('request');
var http = require('http');
var url = require('url');
var logger = require('./logger');
const TuyaWebApi = require('./tuyawebapi');

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

    this.tuyaWebApi = new TuyaWebApi(
        this.username,
        this.password,
        this.countryCode,
        this.platform,
        log
    );

    api.on('didFinishLaunching', function() {

        this.tuyaWebApi.getOrRefreshToken().then(function(token) {

            this.tuyaWebApi.token = token;

            this.tuyaWebApi.discoverDevices().then(function(devices) {
                
                for(const device of devices)
                {
                    //this.addAccessory(device);
                    /*
                    logger.log('debug', device.name);
                    logger.log('debug', device.dev_type);
                    logger.log('debug', device.data);*/

                    var accessory = new SynTexSwitchAccessory(device.name);

                    logger.log('debug', accessory);
                    /*
                    const accessory = createAccessory({
                        log: this.log,
                        api: this.api,
                        bridge: this.bridge,
                        id: device.name,
                        node
                      });
                  
                      //this.accessories.set(id, accessory);
                      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [ accessory ]);
*/
                    api.registerPlatformAccessories('homebridge-syntex-tuya', 'SynTexSwitch', [accessory]);
                }
                // Get device state of all devices - once
                //this.refreshDeviceStates();
            }.bind(this)).catch(function(e) {

                logger.err(e);
            });
            /*
            // Set interval for refreshing device states
            this.refreshInterval = setInterval(() => {
                this.refreshDeviceStates();
            }, this.pollingInterval * 1000);
            */
    
        }.bind(this)).catch(function(e) {

            logger.err(e);
        });

    }.bind(this));

    //DeviceManager.SETUP(logger, this.cacheDirectory);

    restart = false;
}

SynTexTuyaPlatform.prototype = {
    
    accessories : function(callback)
    {
        var accessories = [];
        
        callback(accessories);
        
        var createServerCallback = (async function(request, response)
        {
            try
            {
                var urlParts = url.parse(request.url, true);
                var urlParams = urlParts.query;
                var urlPath = urlParts.pathname;
                var body = [];
                
                body = Buffer.concat(body).toString();

                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Access-Control-Allow-Origin', '*');

                if(urlPath == '/devices' && urlParams.mac)
                {

                }
            }
            catch(e)
            {
                logger.err(e);
            }

        }).bind(this);

        http.createServer(createServerCallback).listen(this.port, '0.0.0.0');
           
        logger.log('info', "Tuya Server läuft auf Port '" + this.port + "'");
    }
}

function SynTexSwitchAccessory(name)
{
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

    //logger.log('debug', this);

    //this.platformAccessory = new this.api.platformAccessory(this.name, 'ubiczuufbzosuzbaicbz');
}


SynTexSwitchAccessory.prototype.getState = function(callback)
{
    callback(null, true);
};

SynTexSwitchAccessory.prototype.setState = function(powerOn, callback, context)
{
    callback();
}

SynTexSwitchAccessory.prototype.getServices = function()
{
    return [this.service];
};