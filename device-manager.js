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
            var accessory = {
                id : id,
                value : await readTuyaAPI(id)
            };

            accessories.push(accessory);

            resolve(accessory.value);
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

function refreshAccessory(accessory)
{
    return new Promise(resolve => {

        readTuyaAPI(accessory.id).then(function(data) {

            if(data != null)
            {
                var found = false;

                for(var i = 0; i < accessories.length; i++)
                {
                    if(accessories[i].id == accessory.id)
                    {
                        accessories[i].value = data.state;

                        found = true;
                    }
                }

                if(!found)
                {
                    accessories.push({ id : accessory.id, value : data.state });
                }
                
                accessory.changeHandler(data.state);
            }

            resolve();
        });
    });
}

function writeTuyaAPI(id, value)
{
    return new Promise(resolve => {
        
        tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value: value ? 1 : 0 }).then(function() {

            resolve(true);
    
        }).catch(function(e) {
    
            logger.err(e);
    
            resolve(false);
        });
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
    refreshAccessory,
    SETUP
};