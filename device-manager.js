var logger, accessories = [];

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

function writeTuyaAPI(id, value)
{
    return new Promise(resolve => {
        
        tuyaWebAPI.setDeviceState(id, 'turnOnOff', { value: value ? 1 : 0 }).then(function() {

            resolve(true);
    
        }.bind(this)).catch(function(e) {
    
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
    
        }.bind(this)).catch(function(e) {
    
            logger.err(e);
    
            resolve(null);
        });
    });
}

function SETUP(log)
{
    logger = log;
}

module.exports = {
    getDevice,
    setDevice,
    SETUP
};