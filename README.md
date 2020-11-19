# Homebridge SynTex Tuya
A plugin to control Tuya devices based on the `tuyawebapi`<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-tuya`
3. Update your `config.json` file. See snippet below.
4. Restart the Homebridge Service with `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`.


## Example Config
**Info:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
{
    "platform": "SynTexTuya",
    "log_directory": "./SynTex/log",
    "port": 1713,
    "username": "xxxxx@mail.com",
    "password": "xxxxxxxxxx",
    "countryCode": "xx",
    "plat": "smart_life"
}
```


## Currently Supported
- Switch
- Outlet
- LED Lights
- Dimmable LED Lights