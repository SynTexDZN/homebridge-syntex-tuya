let DeviceManager = require('./device-manager');
const TuyaWebApi = require('./tuyawebapi');
var tuyaWebAPI, restart = true;
const SynTexDynamicPlatform = require('homebridge-syntex-dynamic-platform').DynamicPlatform;
const SynTexUniversalAccessory = require('./src/universal');

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

                this.initWebServer();

                this.loadAccessories();

                restart = false;
            });
        }
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
                        const homebridgeAccessory = this.getAccessory(device.id);

                        this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, { id : device.id, name : device.name, services : type, manufacturer : this.manufacturer, model : this.model, version : this.version }, { platform : this, logger : this.logger, DeviceManager : DeviceManager }));
                    }
                }

                this.refreshInterval = setInterval(() => {

                    DeviceManager.refreshAccessories(this.accessories);
    
                }, this.pollingInterval * 1000);

                DeviceManager.refreshAccessories(this.accessories);

            }.bind(this)).catch((e) => {

                this.logger.err(e);

                setTimeout(() => this.loadAccessories(), 70000);
            });

        }.bind(this)).catch((e) => {

            this.logger.err(e);
        });
    }

    initWebServer()
    {
        this.WebServer.addPage('/devices', async (response, urlParams) => {

            if(urlParams.id != null)
            {
                var accessory = this.getAccessory(urlParams.id);
    
                if(accessory == null)
                {
                    this.logger.log('error', urlParams.id, '', 'Es wurde kein passendes Gerät in der Config gefunden! ( ' + urlParams.id + ' )');
    
                    response.write('Error');
                }
                else if(urlParams.value != null)
                {
                    var state = null;
    
                    if((state = this.validateUpdate(urlParams.id, accessory.service[1].letters, urlParams.value)) != null)
                    {
                        state = { power : state };

                        if(urlParams.brightness != null)
                        {
                            state.brightness = JSON.parse(urlParams.brightness);
                        }

                        accessory.service[1].changeHandler(state, true);
                    }
                    else
                    {
                        this.logger.log('error', urlParams.id, accessory.service[1].letters, '[' + urlParams.value + '] ist kein gültiger Wert! ( ' + urlParams.mac + ' )');
                    }
    
                    response.write(state != null ? 'Success' : 'Error');
                }
                else
                {
                    accessory.service[1].getState((nothing, state) => response.write(state != null ? state.toString() : 'Error'));
                }
            }
            else
            {
                response.write('Error');
            }
    
            response.end();
        });
    
        this.WebServer.addPage('/accessories', (response) => {
    
            var a = [];

            for(const accessory of this.accessories)
            {
                a.push({
                    mac: accessory[1].id,
                    name: accessory[1].name,
                    services: accessory[1].services,
                    version: '99.99.99',
                    plugin: pluginName
                });
            }
    
            response.write(JSON.stringify(a));
            response.end();
        });
    
        this.WebServer.addPage('/serverside/version', (response) => {
    
            response.write(require('./package.json').version);
            response.end();
        });
    
        this.WebServer.addPage('/serverside/check-restart', (response) => {
    
            response.write(restart.toString());
            response.end();
        });
    
        this.WebServer.addPage('/serverside/update', (response, urlParams) => {
    
            var version = urlParams.version != null ? urlParams.version : 'latest';
    
            const { exec } = require('child_process');
            
            exec('sudo npm install ' + pluginID + '@' + version + ' -g', (error, stdout, stderr) => {
    
                try
                {
                    if(error || stderr.includes('ERR!'))
                    {
                        this.logger.log('warn', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' konnte nicht aktualisiert werden! ' + (error || stderr));
                    }
                    else
                    {
                        this.logger.log('success', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' wurde auf die Version [' + version + '] aktualisiert!');
    
                        restart = true;
    
                        this.logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
    
                        exec('sudo systemctl restart homebridge');
                    }
    
                    response.write(error || stderr.includes('ERR!') ? 'Error' : 'Success');
                    response.end();
                }
                catch(e)
                {
                    this.logger.err(e);
                }
            });
        });
    }

    validateUpdate(mac, letters, state)
    {
        var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
        var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        var type = types[letters.indexOf(letters[0].toUpperCase())];

        if(type === 'motion' || type === 'rain' || type === 'smoke' || type === 'occupancy' || type === 'contact' || type == 'switch' || type == 'relais' || type == 'outlet')
        {
            if(state != true && state != false && state != 'true' && state != 'false')
            {
                this.logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine boolsche Variable! ( ' + mac + ' )');

                return null;
            }

            return (state == 'true' || state == true ? true : false);
        }
        else if(type === 'light' || type === 'temperature')
        {
            if(isNaN(state))
            {
                this.logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
            }

            return !isNaN(state) ? parseFloat(state) : null;
        }
        else if(type === 'humidity' || type === 'airquality')
        {
            if(isNaN(state))
            {
                this.logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
            }

            return !isNaN(state) ? parseInt(state) : null;
        }
        else
        {
            return state;
        }
    }
}