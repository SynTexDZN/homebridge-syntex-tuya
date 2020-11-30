var logger, tuyaWebAPI;

function refreshAccessories(a)
{
    return new Promise(resolve => {

        tuyaWebAPI.getAllDeviceStates().then((devices) => {
                    
            for(const device of devices)
            {
                var state = JSON.parse(device.data.state);

                if(device.data.brightness != null)
                {
                    state = { power : JSON.parse(device.data.state), brightness : JSON.parse(device.data.brightness) / 2.55 };
                }

                console.log(device.data);

                for(var i = 0; i < a.length; i++)
                {
                    if(a[i].id == device.id)
                    {
                        a[i].service[1].changeHandler(state);
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