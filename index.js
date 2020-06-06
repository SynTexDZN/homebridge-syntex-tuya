var Service, Characteristic;
var request = require('request');
var http = require('http');
var url = require('url');
var logger = require('./logger');

module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    
    homebridge.registerPlatform('homebridge-syntex-webhooks', 'SynTexTuya', SynTexTuyaPlatform);
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

    this.tuyaWebApi = new TuyaWebApi(
        this.username,
        this.password,
        this.countryCode,
        this.platform,
        log
    );

    this.tuyaWebApi.getOrRefreshToken().then((token) => {

        this.tuyaWebApi.token = token;

        // Start discovery for devices
        this.tuyaWebApi.discoverDevices().then((devices) => {
            // Add devices to Homebridge
            for (const device of devices) {
                //this.addAccessory(device);
                logger.log('debug', device);
            }
            // Get device state of all devices - once
            //this.refreshDeviceStates();
        }).catch((error) => {
            this.log.error(error);
        });
        /*
        // Set interval for refreshing device states
        this.refreshInterval = setInterval(() => {
            this.refreshDeviceStates();
        }, this.pollingInterval * 1000);
        */

    }).catch((error) => {
        this.log.error(error);
    });

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