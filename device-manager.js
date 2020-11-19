var logger, tuyaWebAPI, accessories = [];

function getDevice(id)
{
    return new Promise(async function(resolve) {

        var found = false;

        for(var i = 0; i < accessories.length; i++)
        {
            if(accessories[i].id == id)
            {
                found = true;

                resolve(accessories[i].value);
            }
        }

        if(!found)
        {
            readTuyaAPI(id).then(function(data) {

                if(data != null)
                {
                    accessories.push({ id : id, value : data.state });
                }

                resolve(data != null ? data.state : null);
            });
        }
    });
}

function setDevice(id, value)
{
    return new Promise(async function(resolve) {

        var found = false;

        for(var i = 0; i < accessories.length; i++)
        {
            if(accessories[i].id == id)
            {
                accessories[i].value = value;

                found = true;
            }
        }

        if(!found)
        {
            accessories.push({ id : id, value : value });
        }

        await writeTuyaAPI(id, value);

        resolve();
    });
}

function refreshAccessories(a)
{
    return new Promise(resolve => {

        tuyaWebAPI.getAllDeviceStates().then((devices) => {
                    
            for(const device of devices)
            {
                var state = device.data.state;

                if(device.data.brightness != null)
                {
                    state = { power : device.data.state, brightness : device.data.brightness };
                }

                console.log(device.data);

                var found = false;

                for(var i = 0; i < accessories.length; i++)
                {
                    if(accessories[i].id == device.id)
                    {
                        accessories[i].value = state;

                        found = true;
                    }
                }

                if(!found)
                {
                    accessories.push({ id : device.id, value : state });
                }

                for(var i = 0; i < a.length; i++)
                {
                    if(a[i].id == device.id)
                    {
                        a[i].changeHandler(state);
                    }
                }
            }

            resolve(true);

        }).catch(function(e) {

            logger.err(e);

            resolve(false);
        });
    });
}

function writeTuyaAPI(id, value)
{
    return new Promise(resolve => {

        if(value instanceof Object)
        {
            if(value.power != null)
            {
                tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value: value.power ? 1 : 0 }).then(function() {

                    resolve(true);
            
                }).catch(function(e) {
            
                    logger.err(e);
            
                    resolve(false);
                });
            }

            if(value.brightness != null && value.power == true)
            {
                tuyaWebAPI.setDeviceState(id, 'brightnessSet', { value: value.brightness }).then(function() {

                    resolve(true);
            
                }).catch(function(e) {
            
                    logger.err(e);
            
                    resolve(false);
                });
            }
        }
        else
        {
            tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value: value ? 1 : 0 }).then(function() {

                resolve(true);
        
            }).catch(function(e) {
        
                logger.err(e);
        
                resolve(false);
            });
        }
    });
}

function readTuyaAPI(id)
{
    return new Promise(resolve => {

        tuyaWebAPI.getDeviceState(id).then(function(data) {
    
            resolve(data);
    
        }).catch(function(e) {
    
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
    getDevice,
    setDevice,
    refreshAccessories,
    SETUP
};