# Homebridge SynTex Tuya
[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-tuya?label=release&color=brightgree&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-tuya/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![NPM Downloads](https://img.shields.io/npm/dt/homebridge-syntex-tuya?color=9944ee&&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-tuya)
[![GitHub Commits](https://img.shields.io/github/commits-since/SynTexDZN/homebridge-syntex-tuya/0.0.0?color=yellow&label=commits&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-tuya/commits)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-tuya?color=0af&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-tuya)

A simple plugin to control Tuya devices based on the `tuyawebapi`<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge<br>
It also offers some tweaks and improvements to the original devices.


## Core Features
- **Device Control:** View and control your Tuya devices.
- **Scene Support:** Connect your Tuya scenes with switches.
- **HTTP Access:** Update and read device states via HTTP calls.
- **Automation:** We integrated our powerful automation API for fast and complex automation.


## Troubleshooting
#### [![GitHub Issues](https://img.shields.io/github/issues-raw/SynTexDZN/homebridge-syntex-tuya?logo=github&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-tuya/issues)
- `Report` us your `Issues`
- `Join` our `Discord Server`
#### [![Discord](https://img.shields.io/discord/442095224953634828?color=5865F2&logoColor=white&label=discord&logo=discord&style=for-the-badge)](https://discord.gg/XUqghtw4DE)


---


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-tuya`
3. Update your `config.json` file. See snippet below.
4. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Info:** If the `baseDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo mkdir -p /var/homebridge/SynTex/` *( create the directory )*
- `sudo chmod -R 777 /var/homebridge/SynTex/` *( permissions for many processes )*
- `sudo chown -R homebridge /var/homebridge/SynTex/` *( permissions only for homebridge )*

```json
"platforms": [
    {
        "platform": "SynTexTuya",
        "baseDirectory": "/var/homebridge/SynTex",
        "username": "xxxxx@mail.com",
        "password": "xxxxxxxxxx",
        "countryCode": "xx",
        "options": {
            "port": 1713,
            "language": "us",
            "platform": "smart_life",
            "pollingInterval": 1200
        },
        "discovery": {
            "addDevices": true,
            "addScenes": true,
            "generateConfig": true
        },
        "log": {
            "debug": false
        },
        "accessories": [
            {
                "id": "ABCDEF1234567890",
                "name": "Overwrite Accessory",
                "services": [
                    {
                        "type": "outlet"
                    }
                ]
            },
            {
                "id": "multi1",
                "name": "Multi Accessory",
                "services": [
                    {
                        "id": "ABCDEF1234567890",
                        "type": "outlet",
                        "name": "Basic Outlet"
                    },
                    {
                        "id": "ABCDEF1234567890",
                        "type": "led",
                        "name": "Basic LED"
                    },
                    {
                        "id": "GHIJKL0987654321",
                        "type": "dimmer",
                        "name": "Basic Dimmer"
                    },
                    {
                        "id": "GHIJKL0987654321",
                        "type": "dimmer",
                        "name": "Modified Dimmer",
                        "min": 12,
                        "max": 32.5
                    },
                    {
                        "id": "MNOPQR1234567890",
                        "type": "blind",
                        "name": "Basic Blind"
                    }
                ]
            }
        ]
    }
]
```

### Required Parameters
- `platform` is always `SynTexTuya`
- `baseDirectory` The path where cache data is stored.
- `username` The username for the account that is registered in the Android / iOS App.
- `password` The password for the account that is registered in the Android / iOS App.
- `countryCode` Your account country code, `1` for USA or `86` for China.
- `accessories` For the accessory config.

### Optional Parameters
- `port` To control your accessory over HTTP calls.
- `language` You can use your country initials if you want to change it *( Currently supported: `us`, `en`, `de` )*
- `platform` The App where you registered your account. `tuya` for Tuya Smart, `smart_life` for Smart Life, `jinvoo_smart` for Jinvoo Smart. Defaults to `tuya`
- `pollingInterval` Defaults to empty which entails no polling. The frequency in seconds that the plugin polls the cloud to get device updates. When you exclusively control the devices through Homebridge, you can set this to a low frequency ( high interval number, e.g. 1800 = 30 minutes ). Minimum is 1030.

### Discovery Parameters
- `addDevices` Adding your existing Tuya devices.
- `addScenes` Creates switches to control your Tuya scenes.
- `generateConfig` Generates an accessory list and includes it into the `config.json` for later editing *( required using the `homebridge-syntex` plugin )*

### Log Parameters
- Disable certain log level: `error`, `warn`, `info`, `read`, `update`, `success` and `debug` *( for example `debug: false` )*

### Accessory Config
- Every accessory needs these parameters: `id`, `name` and `services` *( required )*
- `id` has to be either a `real tuya id` or another `random unique text` *( no duplicates! )*
- `name` could be anything.
- `services` The services of your accessory.<br><br>
    - `name` could be anything.
    - `id` has to be a `real tuya id` *( when using multiple services )*
    - `type` Define the service type *( `blind`, `dimmer`, `led`, `outlet` )*
    - `min` Calibrate the brightness conversion minimum *( from `0` to `100` )*
    - `max` Calibrate the brightness conversion maximum *( from `0` to `100` )*

---


## SynTex UI
Control and set up your devices by installing `homebridge-syntex`<br>
This plugin is made for plugin management, automation system and device control.<br><br>

Check out the GitHub page for more information:<br>
https://github.com/SynTexDZN/homebridge-syntex


## Update Tuya Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&value=`  **New Value**
2. Insert the `Bridge IP` and `Device ID`
3. For the `New Value` you can type this pattern:
- For boolean devices: `true` / `false` *( dimmer, led, outlet, switch )*
- For numeric devices: `10` / `12.4` *( blind )*
- For dimmable lights add `&brightness=`  **New Brightness** *( has to be a number )*
- For accessories with multiple service types add `&type=`  **SERVICETYPE**
- For accessories with multiple services with more than one of the same service type add `&counter=`  **SERVICENUMBER**\
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&type=dimmer&counter=0&value=true&brightness=100`\
*( Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` for example )*


## Read Tuya Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`
- For accessories with multiple service types add `&type=`  **SERVICETYPE**
- For accessories with multiple services with more than one of the same service type add `&counter=`  **SERVICENUMBER**\
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890`\
*( Reads the state of `ABCDEF1234567890` for example )*


## Remove Tuya Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&remove=CONFIRM`
2. Insert the `Bridge IP` and `Device ID`
- To remove a specific service add `&type=`  **SERVICETYPE**
- To remove a specific service from an accessory with more than one of the same service type add `&counter=`  **SERVICENUMBER**\
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1713/devices?id=ABCDEF1234567890&remove=CONFIRM`\
*( Removes `ABCDEF1234567890` from the Config and Home App )*


---


## Automation
To enable the automation module you have to create a file named `automation.json` in your `baseDirectory >> automation` or install the `homebridge-syntex` plugin to create them via UI *( only between SynTex plugins )*<br><br>
**Example:**  For manual configuration update your `automation.json` file. See snippet below.   

```json
{
    "automation": [
        {
            "id": 0,
            "name": "Demo Automation",
            "active": true,
            "trigger": {
                "logic": "AND",
                "groups": [
                    {
                        "logic": "OR",
                        "blocks": [
                            {
                                "id": "multi2",
                                "name": "Multi Device",
                                "letters": "F0",
                                "plugin": "SynTexWebHooks",
                                "operation": "<",
                                "state": {
                                    "value": 1000
                                }
                            },
                            {
                                "operation": "=",
                                "time": "16:00",
                                "options": {
                                    "stateLock": true
                                }
                            }
                        ]
                    },
                    {
                        "logic": "AND",
                        "blocks": [
                            {
                                "id": "multi1",
                                "name": "Multi Switch",
                                "letters": "41",
                                "plugin": "SynTexWebHooks",
                                "operation": "=",
                                "state": {
                                    "value": false
                                },
                                "options": {
                                    "stateLock": true
                                }
                            },
                            {
                                "operation": "=",
                                "days": [
                                    1,
                                    2,
                                    3,
                                    4,
                                    5
                                ]
                            }
                        ]
                    }
                ]
            },
            "result": [
                {
                    "id": "58747302d8afc008d0dc",
                    "name": "Kitchen Dimmable LED",
                    "letters": "90",
                    "plugin": "SynTexTuya",
                    "operation": "=",
                    "state": {
                        "value": true,
                        "brightness": 75
                    }
                },
                {
                    "id": "extern1",
                    "name": "Extern Accessory",
                    "letters": "40",
                    "bridge": "192.168.1.100",
                    "plugin": "SynTexWebHooks",
                    "operation": "=",
                    "state": {
                        "value": false
                    },
                    "options": {
                        "stateLock": false
                    }
                },
                {
                    "operation": "=",
                    "delay": 1000
                },
                {
                    "url": "http://192.168.1.100:1713/devices?id=ABCDEF1234567890&value=true&brightness=100"
                }
            ]
        }
    ]
}
```

### Required Parameters
- `id` A unique ID of your automation.
- `name` The name of the automation.
- `active` Enable / disable a single automation.
- `trigger` What triggers the automation?<br><br>
    - `logic` Define a logical operation for your groups *( `AND`, `OR` )*
    - `groups` Logical layer one<br><br>
        - `logic` Define a logical operation for your blocks *( `AND`, `OR` )*
        - `blocks` Logical layer two<br><br>
- `result` What happens when running an automation?
- `options` General automation options<br><br>
    - `timeLock` Set a timeout to prevent to many executions *( in milliseconds )*

### Block Configuration
#### Service Block ( Trigger, Result )
- `id` is the same like in your config file *( or in your log )*
- `name` The name of the accessory.
- `letters` See letter configuration below.
- `bridge` IP of your other bridge *( optional )*
- `plugin` Use the platform name of the plugin *( optional, see supported plugins below )*
- `operation` Use the logical operands *( `>`, `<`, `=` )*
- `state` The state of your accessory.<br><br>
    - `value` is used for the main characteristic.
    - `brightness` can be used for dimmable / RGB lights.
    - `hue` can be used for RGB lights.
    - `saturation` can be used for RGB lights.

#### Time Block ( Trigger )
- `operation` Use the logical operands *( `>`, `<`, `=` )*
- `time` Define a time point *( e.g. `16:00` )*

#### Weekday Block ( Trigger )
- `operation` Use the logical operands *( `=` )*
- `days` Set the weekdays *( from `0` to `6` )*

#### Delay Block ( Result )
- `delay` Set a timeout *( in milliseconds )*

#### URL Block ( Result )
- `url` Fetch an URL.

### Letter Configuration
The letters are split into two parts *( characters )*

**1. Service Type**
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
- A : Contact
- B : Motion
- C : Temperature
- D : Humidity
- E : Rain
- F : Light
- G : Blind
- H : Thermostat
- I : Fan

**2. Duplicate Counter**
- If there are more services of the same type the counter indicates which is which
- Simply count from top to bottom.

**Example:**  The first switch in your config has the letters `40`, the second `41` and so on ..

### Supported Plugins
- SynTexKNX *( `homebridge-syntex-knx` )*
- SynTexMagicHome *( `homebridge-syntex-magichome` )*
- SynTexTuya *( `homebridge-syntex-tuya` )*
- SynTexWebHooks *( `homebridge-syntex-webhooks` )*


---


## Currently Supported
- Outlets
- LED Lights / Dimmable Lights
- Blinds / Shutters / Window Coverings
- Scenes *( From the Tuya app )*