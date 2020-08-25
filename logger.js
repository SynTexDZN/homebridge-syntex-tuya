var logger = exports, prefix;
var store = require('json-fs-store');
var conf;
logger.logs;
logger.debugLevel = 'success';

logger.create = function(pluginName, logDirectory, config)
{
    prefix = pluginName;
    conf = store(config);
    logger.logs = store(logDirectory);
};

logger.log = function(level, mac, letters, message)
{
    var levels = ['success', 'update', 'read', 'info', 'warn', 'error', 'debug'];

    if(levels.indexOf(level) >= levels.indexOf(logger.debugLevel))
    {
        if(typeof message !== 'string')
        {
            message = JSON.stringify(message);
        };

        var color = '';

        if(level == 'success')
        {
            color = '\x1b[92m';
        }
        else if(level == 'update')
        {
            color = '\x1b[96m';
        }
        else if(level == 'read')
        {
            color = '\x1b[36m';
        }
        else if(level == 'info')
        {
            color = '\x1b[93m';
        }
        else if(level == 'warn')
        {
            color = '\x1b[93m';
        }
        else if(level == 'debug')
        {
            color = '\x1b[35m';
        }
        else
        {
            color = '\x1b[31m';
        }

        console.log('[' + prefix + '] ' + color + '[' + level.toUpperCase() + '] \x1b[0m' + message);

        saveLog(level[0].toUpperCase() + level.substring(1), mac, letters, Math.round(new Date().getTime() / 1000), message);
    }
}

logger.err = function(error)
{
    var s = (error.stack.split('\n')[1].split('\n')[0].match(/\//g) || []).length;
    logger.log('error', 'bridge', 'Bridge', 'Code Fehler: ' + error.message + " ( [" + error.stack.split('\n')[1].split('\n')[0].split('/')[s].split(':')[0] + "] bei Zeile [" + error.stack.split('\n')[1].split('\n')[0].split('/')[s].split(':')[1] + "] )");
}

logger.debug = function(message)
{
    logger.log('debug', 'bridge', 'Bridge', message);
}

logger.list = function()
{
    return new Promise(async function(resolve) {

        var logPath = await getLogPath(prefix);

        logger.debug(logPath);

        store(logPath).list(function(err, objects)
        {
            if(!objects || err)
            {
                resolve([]);
            }
            else
            {
                resolve(objects);
            }
        });
    });
}

logger.load = function(pluginName, group)
{
    return new Promise(async function(resolve) {
        
        var logPath = await getLogPath(pluginName);

        if(logPath != null)
        {
            store(logPath).load(pluginName, (err, obj) => {    

                if(obj && !err)
                {    
                    var logs = [];

                    for(const i in obj)
                    {
                        console.log('I: ' + i);

                        if(i != 'id' && (group == null || group == i))
                        {
                            for(const k in obj[i])
                            {
                                console.log('K: ' + k);

                                for(const j in obj[i][k])
                                {
                                    console.log('J: ' + j);

                                    if(group == null || obj[i][k][j].l == 'Update' || obj[i][k][j].l == 'Success')
                                    {
                                        var l = obj[i][k][j];
                                        logs.push({ t : l.t, l : l.l, m : l.m, s : k });
                                    }
                                }
                            }
                        }
                    }

                    logs.sort(function(a, b) {

                        var keyA = new Date(a.t), keyB = new Date(b.t);
                        
                        if (keyA < keyB) return 1;
                        if (keyA > keyB) return -1;
                        
                        return 0;
                    });

                    resolve(logs);
                }
                else
                {
                    resolve(null);
                }
            });
        }
        else
        {
            resolve(null);
        }
    });
}

function getLogPath(pluginName)
{
    return new Promise(resolve => {
        
        conf.load('config', (err, obj) => {    

            if(obj && !err)
            {                            
                for(const i in obj.platforms)
                {
                    if(obj.platforms[i].platform === pluginName)
                    {
                        resolve(obj.platforms[i].log_directory);
                    }
                }
            }

            resolve(null);
        });
    });
}

var inWork = false;
var que = [];

async function saveLog(level, mac, letters, time, message)
{
    var queOBJ = { mac : mac, letters : letters, time : time, level : level, message : message };

    if(inWork)
    {
        if(!que.some(element => element.time == time && element.message == message))
        {
            que.push(queOBJ);
        }
    }
    else
    {
        inWork = true;

        if(que.some(element => element.time == time && element.message == message))
        {
            que.shift();
        }

        logger.logs.load(prefix, (err, device) => {    

            if(device && !err)
            {    
                device = removeExpired(device);

                if(!device[mac])
                {
                    device[mac] = {};
                }

                if(!device[mac][letters])
                {
                    device[mac][letters] = [];
                }

                device[mac][letters][device[mac][letters].length] = { t : time, l : level, m : message };

                logger.logs.add(device, function(err) {

                    inWork = false;

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', prefix + '.json konnte nicht aktualisiert werden! ' + err);
                    }

                    if(que.length != 0)
                    {
                        saveLog(que[0].level, que[0].mac, que[0].letters, que[0].time, que[0].message);
                    }
                });
            }
            else
            {
                var entry = { id : prefix };

                entry[mac] = {};

                entry[mac][letters] = [ { t : time, l : level, m : message } ];

                logger.logs.add(entry, (err) => {

                    inWork = false;

                    if(err)
                    {
                        logger.log('error', 'bridge', 'Bridge', prefix + '.json konnte nicht aktualisiert werden! ' + err);
                    }

                    if(que.length != 0)
                    {
                        saveLog(que[0].level, que[0].mac, que[0].letters, que[0].time, que[0].message);
                    }
                });
            }
        });
    }
}

function removeExpired(obj)
{
    for(var i = 1; i < Object.keys(obj).length; i++)
    {
        if(obj[Object.keys(obj)[i]].logs)
        {
            for(var j = 1; j < obj[Object.keys(obj)[i]].logs.length + 1; j++)
            {
                var time = obj[Object.keys(obj)[i]].logs[obj[Object.keys(obj)[i]].logs.length - j].t;

                if(new Date() - new Date(time * 1000) > 86400000)
                {
                    console.log('REMOVE', JSON.stringify(obj[Object.keys(obj)[i]].logs.length - j));
                    obj[Object.keys(obj)[i]].logs.splice(obj[Object.keys(obj)[i]].logs.indexOf(obj[Object.keys(obj)[i]].logs[obj[Object.keys(obj)[i]].logs.length - j]), 1);
                }
            }
        }
    }

    return obj;
}