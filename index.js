let DeviceManager = require('./device-manager'), WebServer = require('./webserver'), logger = require('./logger');
const TuyaWebApi = require('./tuyawebapi');
var Service, Characteristic;
var tuyaWebAPI, restart = true;
const SynTexSwitchAccessory = require('./accessories/switch'), SynTexBulbAccessory = require('./accessories/bulb'), SynTexDimmerAccessory = require('./accessories/dimmer');
const SynTexDynamicPlatform = require('homebridge-syntex-dynamic-platform').DynamicPlatform;
const SynTexUniversalAccessory = require('./accessories/universal');

const pluginID = 'homebridge-syntex-tuya';
const pluginName = 'SynTexTuya';

module.exports = (homebridge) => {

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform(pluginID, pluginName, SynTexTuyaPlatform, true);
};

class SynTexTuyaPlatform extends SynTexDynamicPlatform
{
    constructor(log, sconfig, api)
    {
        super(sconfig, api, pluginID, pluginName);

        this.username = sconfig['username'];
        this.password = sconfig['password'];
        this.countryCode = sconfig['countryCode'] || '49';
        this.platform = sconfig['plat'] || 'smart_life';
        this.pollingInterval = Math.max((sconfig['pollingInterval'] || 610), 610);
        this.defaults = sconfig['defaults'] || [];
        
        this.cacheDirectory = sconfig['cache_directory'] || './SynTex';
        this.logDirectory = sconfig['log_directory'] || './SynTex/log';
        this.port = sconfig['port'] || 1713;

        if(this.api && this.logger)
        {
            this.api.on('didFinishLaunching', () => {

                tuyaWebAPI = new TuyaWebApi(
                    this.username,
                    this.password,
                    this.countryCode,
                    this.platform,
                    this.logger
                );

                DeviceManager.SETUP(this.logger, tuyaWebAPI);

                this.loadAccessories();
    
                restart = false;
                /*
                this.logger.debug('Initialisiere ' + pluginName + ' ...');
    
                var devices = ['acc1', 'acc2', 'acc3', 'acc4', 'acc5'];
    
                for(const id of devices)
                {
                    if(this.accessories.get(this.api.hap.uuid.generate(id)) != null)
                    {
                        //this.removeAccessory(this.accessories.get(this.api.hap.uuid.generate(id)));
                    }
                }
    
                var devices = [{id : 'acc1', name : 'Accessory 1', services : [{ type : 'outlet', name : 'Outlet 1' }, { type : 'outlet', name : 'Outlet 2' }, { type : 'outlet', name : 'Outlet 3' }, { type : 'outlet', name : 'Outlet 4' }, { type : 'outlet', name : 'Outlet 5' }]},
                    {id : 'acc2', name : 'Accessory 2', services : ['led', 'dimmer', 'rgb', 'switch']},
                    {id : 'acc3', name : 'Accessory 3', services : ['dimmer']},
                    {id : 'acc4', name : 'Accessory 4', services : 'led'},
                    {id : 'acc5', name : 'Accessory 5', services : 'contact'}];
    
                for(const device of devices)
                {
                    this.addAccessory(device);
                }
                */
            });
        }
        /*
        logger = new logger(pluginName, this.logDirectory, api.user.storagePath());
        WebServer = new WebServer(pluginName, logger, this.port, false);
    
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
        */
    }

    loadAccessories()
    {
        tuyaWebAPI.getOrRefreshToken().then(function(token) {

            tuyaWebAPI.token = token;

            tuyaWebAPI.discoverDevices().then(function(devices) {
                
                for(const device of devices)
                {
                    var type = device.dev_type;

                    if(type == 'switch' || type == 'outlet' || type == 'light' || type == 'dimmer')
                    {
                        if(type == 'light')
                        {
                            type = 'dimmer';
                        }
                        else if(type == 'switch')
                        {
                            type = 'outlet';
                        }

                        const homebridgeAccessory = this.getAccessory(device.id);

                        var S = new SynTexUniversalAccessory(homebridgeAccessory, { id : device.id, name : device.name, services : type }, { platform : this, logger : this.logger });

                        this.addAccessory(S);
                    }
                }

                this.refreshInterval = setInterval(() => {

                    //DeviceManager.refreshAccessories(accessories);
    
                }, this.pollingInterval * 1000);

                //DeviceManager.refreshAccessories(accessories);

            }.bind(this)).catch((e) => {

                logger.err(e);
            });

        }.bind(this)).catch((e) => {

            logger.err(e);
        });
    }
}
/*
function SynTexTuyaPlatform(log, sconfig, api)
{
    this.username = sconfig['username'];
    this.password = sconfig['password'];
    this.countryCode = sconfig['countryCode'] || '49';
    this.platform = sconfig['plat'] || 'smart_life';
    this.pollingInterval = Math.max((sconfig['pollingInterval'] || 610), 610);
    this.defaults = sconfig['defaults'] || [];
    
    this.cacheDirectory = sconfig['cache_directory'] || './SynTex';
    this.logDirectory = sconfig['log_directory'] || './SynTex/log';
    this.port = sconfig['port'] || 1713;
    
    logger = new logger(pluginName, this.logDirectory, api.user.storagePath());
    WebServer = new WebServer(pluginName, logger, this.port, false);

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
                    if(device.dev_type == 'switch' || device.dev_type == 'outlet')
                    {
                        var accessory = new SynTexSwitchAccessory(device, { Service, Characteristic, DeviceManager, logger });

                        accessories.push(accessory);
                    }
                    else if(device.dev_type == 'dimmer')
                    {
                        var accessory = new SynTexDimmerAccessory(device, { Service, Characteristic, DeviceManager, logger });

                        accessories.push(accessory);
                    }
                    else if(device.dev_type == 'light')
                    {
                        var accessory = new SynTexDimmerAccessory(device, { Service, Characteristic, DeviceManager, logger });

                        accessories.push(accessory);
                    }
                }

                this.refreshInterval = setInterval(() => {

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
                            var state = null;
	
                            if((state = validateUpdate(urlParams.id, accessory.letters, urlParams.value)) != null)
                            {
                                DeviceManager.setDevice(urlParams.id, state); // TODO : Concat RGB Light Services

                                accessory.changeHandler(state);
                            }
                            else
                            {
                                logger.log('error', urlParams.id, accessory.letters, '[' + urlParams.value + '] ist kein gültiger Wert! ( ' + urlParams.mac + ' )');
                            }
            
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

                WebServer.addPage('/accessories', (response) => {

                    var a = [];

                    for(var i = 0; i < accessories.length; i++)
                    {
                        a[i] = {
                            mac: accessories[i].id,
                            name: accessories[i].name,
                            services: accessories[i].services,
                            version: '99.99.99',
                            plugin: pluginName
                        };
                    }

                    response.write(JSON.stringify(a));
                    response.end();
                });

                WebServer.addPage('/serverside/version', (response) => {

                    response.write(require('./package.json').version);
                    response.end();
                });
        
                WebServer.addPage('/serverside/check-restart', (response) => {
        
                    response.write(restart.toString());
                    response.end();
                });
        
                WebServer.addPage('/serverside/update', (response, urlParams) => {
        
                    var version = urlParams.version != null ? urlParams.version : 'latest';
        
                    const { exec } = require('child_process');
                    
                    exec('sudo npm install ' + pluginID + '@' + version + ' -g', (error, stdout, stderr) => {
        
                        try
                        {
                            if(error || stderr.includes('ERR!'))
                            {
                                logger.log('warn', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' konnte nicht aktualisiert werden! ' + (error || stderr));
                            }
                            else
                            {
                                logger.log('success', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' wurde auf die Version [' + version + '] aktualisiert!');
        
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

            }.bind(this)).catch((e) => {

                logger.err(e);
            });

        }.bind(this)).catch((e) => {

            logger.err(e);
        });
    }
}

function validateUpdate(mac, letters, state)
{
    var type = letterToType(letters[0]);

    if(type === 'motion' || type === 'rain' || type === 'smoke' || type === 'occupancy' || type === 'contact' || type == 'switch' || type == 'relais')
    {
        if(state != true && state != false && state != 'true' && state != 'false')
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine boolsche Variable! ( ' + mac + ' )');

            return null;
        }

        return (state == 'true' || state == true ? true : false);
    }
    else if(type === 'light' || type === 'temperature')
    {
        if(isNaN(state))
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
        }

        return !isNaN(state) ? parseFloat(state) : null;
    }
    else if(type === 'humidity' || type === 'airquality')
    {
        if(isNaN(state))
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
        }

        return !isNaN(state) ? parseInt(state) : null;
    }
    else
    {
        return state;
    }
}

var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch'];
var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6'];

function letterToType(letter)
{
    return types[letters.indexOf(letter.toUpperCase())];
}

function typeToLetter(type)
{
    return letters[types.indexOf(type.toLowerCase())];
}
*/