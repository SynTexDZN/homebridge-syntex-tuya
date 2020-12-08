var logger, tuyaWebAPI;

module.exports = class DeviceManager
{
    constructor(log, api)
    {
        logger = log;
        tuyaWebAPI = api;
    }

    refreshAccessories(accessories)
    {
        this.logger.debug('Geräte Status aktualisieren ..');

        return new Promise(resolve => {

            tuyaWebAPI.getAllDeviceStates().then((devices) => {
                        
                for(const device of devices)
                {
                    var state = { power : device.data.state };

                    try
                    {
                        if(device.data.state != null)
                        {
                            state.power = JSON.parse(device.data.state);
                        }

                        if(device.data.brightness != null)
                        {
                            state.brightness = JSON.parse(device.data.brightness) / 2.55;
                        }
                    }
                    catch(e)
                    {
                        logger.err(e);
                    }

                    for(const accessory of accessories)
                    {
                        if(accessory[1].id == device.id)
                        {
                            accessory[1].service[1].updateState(state);
                        }
                    }
                }

                resolve(true);

            }).catch((e) => {

                logger.err(e);

                resolve(false);
            });
        });
    }

    getState(id)
    {
        return new Promise((resolve) => {

            tuyaWebAPI.getDeviceState(id).then((data) => {
                
                resolve(data != null ? JSON.parse(data.state) : null);
        
            }).catch((e) => {
        
                logger.err(e);
        
                resolve(null);
            });
        });
    }

    getBrightness(id)
    {
        return new Promise((resolve) => {

            tuyaWebAPI.getDeviceState(id).then((data) => {
                
                resolve(data != null ? JSON.parse(data.brightness) / 2.55 : null);
        
            }).catch((e) => {
        
                logger.err(e);
        
                resolve(null);
            });
        });
    }

    setState(id, value)
    {
        return new Promise((resolve) => {

            tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value: value ? 1 : 0 }).then(() => {

                resolve(true);
        
            }).catch((e) => {
        
                logger.err(e);

                resolve(false);
            });
        });
    }

    setBrightness(id, value)
    {
        return new Promise((resolve) => {

            tuyaWebAPI.setDeviceState(id, 'brightnessSet', { value: value }).then(() => {

                resolve(true);
        
            }).catch((e) => {
        
                logger.err(e);
        
                resolve(false);
            });
        });
    }
}