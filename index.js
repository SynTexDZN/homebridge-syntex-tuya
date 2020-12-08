let DeviceManager = require('./device-manager');

const TuyaWebApi = require('./tuyawebapi');
const SynTexDynamicPlatform = require('homebridge-syntex-dynamic-platform').DynamicPlatform;
const SynTexUniversalAccessory = require('./src/universal');

const pluginID = 'homebridge-syntex-tuya';
const pluginName = 'SynTexTuya';

var tuyaWebAPI, restart = true;

module.exports = (homebridge) => {

    homebridge.registerPlatform(pluginID, pluginName, SynTexTuyaPlatform, true);
};

class SynTexTuyaPlatform extends SynTexDynamicPlatform
{
    constructor(log, config, api)
    {
        super(config, api, pluginID, pluginName);

        this.username = config['username'];
        this.password = config['password'];
        this.countryCode = config['countryCode'] || '49';
        this.platform = config['plat'] || 'smart_life';
        this.pollingInterval = Math.max((config['pollingInterval'] || 610), 610);
        this.defaults = config['defaults'] || [];
        
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

                DeviceManager = new DeviceManager(this.logger, tuyaWebAPI);

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

                DeviceManager.refreshAccessories(this.accessories);

                this.refreshInterval = setInterval(() => {

                    DeviceManager.refreshAccessories(this.accessories);
    
                }, this.pollingInterval * 1000);

            }.bind(this)).catch((e) => {

                this.logger.err(e);

                setTimeout(() => this.loadAccessories(), 70 * 1000);
            });

        }.bind(this)).catch((e) => {

            this.logger.err(e);

            setTimeout(() => this.loadAccessories(), 70 * 1000);
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
                    var state = { power : urlParams.value };

                    if(urlParams.brightness != null)
                    {
                        state.brightness = urlParams.brightness;
                    }
    
                    if((state = this.validateUpdate(urlParams.id, accessory.service[1].letters, state)) != null)
                    {
                        accessory.service[1].changeHandler(state);
                    }
                    else
                    {
                        this.logger.log('error', urlParams.id, accessory.service[1].letters, '[' + accessory.name + '] konnte nicht aktualisiert werden! ( ' + urlParams.id + ' )');
                    }
    
                    response.write(state != null ? 'Success' : 'Error');
                }
                else if(urlParams.remove != null)
				{
					if(urlParams.remove == 'CONFIRM')
					{
						this.removeAccessory(accessory);
					}

					response.write(urlParams.remove == 'CONFIRM' ? 'Success' : 'Error');
				}
                else
                {
                    var state = null;
					
					if(accessory.homebridgeAccessory != null
						&& accessory.homebridgeAccessory.context != null
						&& accessory.homebridgeAccessory.context.data != null
						&& accessory.service[1] != null
						&& accessory.service[1].letters != null)
					{
						state = accessory.homebridgeAccessory.context.data[accessory.service[1].letters];
					}

                    response.write(state != null ? JSON.stringify(state) : 'Error');
                }
            }
            else
            {
                response.write('Error');
            }
    
            response.end();
        });
    
        this.WebServer.addPage('/accessories', (response) => {
    
            var accessories = [];

            for(const accessory of this.accessories)
            {
                accessories.push({
                    id: accessory[1].id,
                    name: accessory[1].name,
                    services: accessory[1].services,
                    version: '99.99.99',
                    plugin: pluginName
                });
            }
    
            response.write(JSON.stringify(accessories));
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
    
                response.write(error || (stderr && stderr.includes('ERR!')) ? 'Error' : 'Success');
                response.end();

                if(error || (stderr && stderr.includes('ERR!')))
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
            });
        });
    }

    validateUpdate(id, letters, state)
    {
        var data = {
            A : { type : 'contact', format : 'boolean' },
            B : { type : 'motion', format : 'boolean' },
            C : { type : 'temperature', format : 'number' },
            D : { type : 'humidity', format : 'number' },
            E : { type : 'rain', format : 'boolean' },
            F : { type : 'light', format : 'number' },
            0 : { type : 'occupancy', format : 'boolean' },
            1 : { type : 'smoke', format : 'boolean' },
            2 : { type : 'airquality', format : 'number' },
            3 : { type : 'rgb', format : { power : 'boolean', brightness : 'number', saturation : 'number', hue : 'number' } },
            4 : { type : 'switch', format : 'boolean' },
            5 : { type : 'relais', format : 'boolean' },
            6 : { type : 'statelessswitch', format : 'number' },
            7 : { type : 'outlet', format : 'boolean' },
            8 : { type : 'led', format : 'boolean' },
            9 : { type : 'dimmer', format : { power : 'boolean', brightness : 'number' } }
        };

        for(const i in state)
        {
            try
            {
                state[i] = JSON.parse(state[i]);
            }
            catch(e)
            {
                this.logger.log('warn', id, letters, 'Konvertierungsfehler: [' + state[i] + '] konnte nicht gelesen werden! ( ' + id + ' )');

                return null;
            }

            var format = data[letters[0].toUpperCase()].format;

            if(format instanceof Object)
            {
                format = format[i];
            }

            if(typeof state[i] != format)
            {
                this.logger.log('warn', id, letters, 'Konvertierungsfehler: [' + state[i] + '] ist keine ' + (format == 'boolean' ? 'boolsche' : format == 'number' ? 'numerische' : 'korrekte') + ' Variable! ( ' + id + ' )');

                return null;
            }
        }

        return state;
    }
}