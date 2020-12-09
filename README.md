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
	"options": {
		"username": "xxxxx@mail.com",
		"password": "xxxxxxxxxx",
		"countryCode": "xx",
		"platform": "smart_life",
		"pollingInterval": 1200
	}
}
```


## Update HTTP Devices
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&value=`  **New Value**
2. Insert the `Bridge IP` and `Device ID`
3. For the `New Value` you can type this pattern:
- For all devices: `true` / `false` ( *outlet, switch, light, dimmable light* )
- For dimmable lights add `&brightness=`  **New Brightness** ( *has to be a number* )

**Example:**  `http://homebridge.local/devices?id=ABCDEF1234567890&value=true&brightness=100`\
( *Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` as example* )


## Read HTTP Device Values
1. Open `http://`  **Bridge IP**  `/devices?mac=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local/devices?id=ABCDEF1234567890`\
( *Reads the value of `ABCDEF1234567890` as example* )


## Currently Supported
- Outlets
- LED Lights
- Dimmable LED Lights