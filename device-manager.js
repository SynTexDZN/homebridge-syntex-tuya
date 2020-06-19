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

                logger.log('debug', 'FOUND 3 ' + accessories[i].id + ' - ' + id);

                resolve(accessories[i].value);
            }
        }

        if(!found)
        {
            readTuyaAPI(id).then(function(data) {

                if(data != null)
                {
                    var accessory = {
                        id : id,
                        value : data.state 
                    };

                    logger.log('debug', 'PUSH 3 ' + accessories[i].id + ' - ' + data.state);
        
                    accessories.push(accessory);
                }

                resolve(data.state || null);
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

                logger.log('debug', 'FOUND 2 ' + accessories[i].id + ' - ' + id);
            }
        }

        if(!found)
        {
            logger.log('debug', 'PUSH 2 ' + id + ' - ' + value);

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

                        logger.log('debug', 'FOUND 1 ' + accessories[i].id + ' - ' + accessory.id);
                    }
                }

                if(!found)
                {
                    logger.log('debug', 'PUSH 1 ' + accessories[i].id + ' - ' + data.state);

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