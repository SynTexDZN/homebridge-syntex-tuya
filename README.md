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
**Info:** If the `logDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` *( permissions only for homebridge )*
- `sudo chmod 777 -R homebridge ./SynTex/` *( permissions for many processes )*

```json
"platforms": [
    {
        "platform": "SynTexTuya",
        "logDirectory": "./SynTex/log",
        "port": 1713,
        "language": "us",
        "debug": false,
        "options": {
            "username": "xxxxx@mail.com",
            "password": "xxxxxxxxxx",
            "countryCode": "xx",
            "platform": "smart_life",
            "pollingInterval": 1200,
            "discoverScenes": false
        }
    }
]
```
### Required Parameters
- `platform` is always `SynTexTuya`
- `logDirectory` The path where your logs are stored.
- `username` The username for the account that is registered in the Android / iOS App.
- `password` The password for the account that is registered in the Android / iOS App.
- `countryCode` Your account country code, e.g., `1` for USA or `86` for China.

### Optional Parameters
- `port` To control your accessory over HTTP calls.
- `language` You can use your country initials if you want to change it *( Currently supported: `us`, `en`, `de` )*
- `debug` For further information because of troubleshooting and bug reports.
- `platform` The App where you registered your account. `tuya` for Tuya Smart, `smart_life` for Smart Life, `jinvoo_smart` for Jinvoo Smart. Defaults to `tuya`
- `pollingInterval` Defaults to empty which entails no polling. The frequency in seconds that the plugin polls the cloud to get device updates. When you exclusively control the devices through Homebridge, you can set this to a low frequency (high interval number, e.g. 1800 = 30 minutes). Minimum is 610.
- `discoverScenes` Adds switches to control your Tuya scenes.


---


## Update Tuya Devices
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&value=`  **New Value**
2. Insert the `Bridge IP` and `Device ID`
3. For the `New Value` you can type this pattern:
- For all devices: `true` / `false` *( outlet, switch, light, dimmable light )*
- For dimmable lights add `&brightness=`  **New Brightness** *( has to be a number )*

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&value=true&brightness=100`\
*( Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` as example )*


## Read Tuya Device Values
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890`\
*( Reads the value of `ABCDEF1234567890` as example )*


## Remove Tuya Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&remove=CONFIRM`
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&remove=CONFIRM`\
*( Removes `ABCDEF1234567890` from the Home app )*


---


## Automation
To enable the automation module you have to create a file named `automation.json` in your `automationDirectory` or install the `homebridge-syntex` plugin to create them via UI *( only between syntex plugins )*<br><br>
**Example:**  For manual configuration update your `automation.json` file. See snippet below.   

```json
{
  "id": "automation",
  "automation": [
    {
      "id": 0,
      "name": "Demo Automation",
      "active": true,
      "trigger": [
        {
          "id": "multi2",
          "name": "Multi Device",
          "letters": "F0",
          "plugin": "SynTexWebHooks",
          "operation": "<",
          "value": "1000"
        }
      ],
      "condition": [
        {
          "id": "multi1",
          "name": "Multi Switch",
          "letters": "41",
          "plugin": "SynTexWebHooks",
          "operation": "=",
          "value": "false"
        }
      ],
      "result": [
        {
          "id": "58747302d8afc008d0dc",
          "name": "Kitchen Dimmable LED",
          "letters": "90",
          "plugin": "SynTexTuya",
          "operation": "=",
          "value": "true",
          "brightness": "75"
        },
        {
          "url": "http://192.168.178.100:1713/devices?id=58757402d8bfc108d0dc&value=true&brightness=100"
        }
      ]
    }
  }
}
```
### Required Parameters
- `id` is the same like in your config file *( or in your log )*
- `name` The name of the accessory.
- `letters` See letter configuration below.
- `operation` Use the logical operands *( `>`, `<`, `=` )*
- `value` The state of your accessory.


### Optional Parameters
- `plugin` Use the platform name of the plugin *( see supported plugins below )*
- `brightness` is used for dimmable lights.


### Letter Configuration
The letters are split into two parts *( numbers )*

**1. Service Type**
- A : Contact
- B : Motion
- C : Temperature
- D : Humidity
- E : Rain
- F : Light
- 0 : Occupancy
- 1 : Smoke
- 2 : Airquality
- 3 : RGB
- 4 : Switch
- 5 : Relais
- 6 : Stateless Switch
- 7 : Outlet
- 8 : LED
- 9 : Dimmer

**2. Duplicate Counter**
- If there are more services of the same type the counter indicates which is which
- Simply count from top to bottom.

**Example:**  The first switch in your config has the letters `40`, the second `41` and so on ..


### Supported Plugins
- SynTexMagicHome *( `homebridge-syntex-magichome` )*
- SynTexTuya *( `homebridge-syntex-tuya` )*
- SynTexWebHooks *( `homebridge-syntex-webhooks` )*


---


## Currently Supported
- Outlets
- LED Lights
- Dimmable LED Lights
- Scenes *( From the Tuya app )*