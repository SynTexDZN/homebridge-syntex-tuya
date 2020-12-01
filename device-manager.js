var logger, tuyaWebAPI;

function refreshAccessories(accessories)
{
    return new Promise(resolve => {

        tuyaWebAPI.getAllDeviceStates().then((devices) => {
                    
            for(const device of devices)
            {
                var state = device.data.state;

                if(device.data.state != null)
                {
                    state = { power : JSON.parse(device.data.state) };
                }

                if(device.data.brightness != null)
                {
                    state.brightness = JSON.parse(device.data.brightness) / 2.55;
                }

                console.log(device.data);

                console.log(state);

                for(const accessory of accessories)
                {
                    if(accessory[1].id == device.id)
                    {
                        console.log('CHANGE HANDLER', device.id);

                        accessory[1].service[1].changeHandler(state, false);
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

function setState(id, value)
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

function setBrightness(id, value)
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

function getState(id)
{
    return new Promise((resolve) => {

        tuyaWebAPI.getDeviceState(id).then((data) => {
            
            resolve(data != null ? data.state : null);
    
        }).catch((e) => {
    
            logger.err(e);
    
            resolve(null);
        });
    });
}

function getBrightness(id)
{
    return new Promise((resolve) => {

        tuyaWebAPI.getDeviceState(id).then((data) => {
            
            resolve(data != null ? data.brightness / 2.55 : null);
    
        }).catch((e) => {
    
            logger.err(e);
    
            resolve(null);
        });
    });
}

function SETUP(log, api)
{
    logger = log;
    tuyaWebAPI = api;
}

module.exports = {
    getState,
    getBrightness,
    setState,
    setBrightness,
    refreshAccessories,
    SETUP
};