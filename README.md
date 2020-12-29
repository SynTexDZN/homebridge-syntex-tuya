# Homebridge SynTex Tuya
A plugin to control Tuya devices based on the `tuyawebapi`<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge

[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-tuya?label=release&color=brightgreen)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-tuya/beta?color=orange&label=beta)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![GitHub Commits](https://badgen.net/github/commits/SynTexDZN/homebridge-syntex-tuya?color=yellow)](https://github.com/SynTexDZN/homebridge-syntex-tuya/commits)
[![NPM Downloads](https://badgen.net/npm/dt/homebridge-syntex-tuya?color=purple)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-tuya?color=0af)](https://github.com/SynTexDZN/homebridge-syntex-tuya)
[![Discord](https://img.shields.io/discord/442095224953634828?color=728ED5&label=discord)](https://discord.gg/XUqghtw4DE)

<br>

## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-tuya`
3. Update your `config.json` file. See snippet below.
4. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Info:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
{
	"platform": "SynTexTuya",
	"log_directory": "./SynTex/log",
	"port": 1713,
	"language": "us",
	"debug": false,
	"options": {
		"username": "xxxxx@mail.com",
		"password": "xxxxxxxxxx",
		"countryCode": "xx",
		"platform": "smart_life",
		"polling_interval": 1200
	}
}
```
- For the `language` you can use your country initials ( *Currently supported: `us`, `en`, `de`* )
- If you need further information for troubleshooting and bug reports you can enable the `debug` attribute
---
- `username` Required. The username for the account that is registered in the Android / iOS App.
- `password` Required. The password for the account that is registered in the Android / iOS App.
- `countryCode` Required. Your account country code, e.g., `1` for USA or `86` for China.
- `Platform` Optional. The App where you registered your account. `tuya` for Tuya Smart, `smart_life` for Smart Life, `jinvoo_smart` for Jinvoo Smart. Defaults to `tuya`.
- `polling_interval` Optional. Defaults to empty which entails no polling. The frequency in seconds that the plugin polls the cloud to get device updates. When you exclusively control the devices through Homebridge, you can set this to a low frequency (high interval number, e.g. 1800 = 30 minutes). Minimum is 610.


## Update Tuya Devices
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&value=`  **New Value**
2. Insert the `Bridge IP` and `Device ID`
3. For the `New Value` you can type this pattern:
- For all devices: `true` / `false` ( *outlet, switch, light, dimmable light* )
- For dimmable lights add `&brightness=`  **New Brightness** ( *has to be a number* )

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&value=true&brightness=100`\
( *Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` as example* )


## Read Tuya Device Values
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890`\
( *Reads the value of `ABCDEF1234567890` as example* )


## Remove Tuya Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&remove=CONFIRM`
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&remove=CONFIRM`\
( *Removes `ABCDEF1234567890` from the home app* )


## Currently Supported
- Outlets
- LED Lights
- Dimmable LED Lights