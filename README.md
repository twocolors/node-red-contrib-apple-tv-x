
# node-red-contrib-apple-tv-x

## About

Nodes for controlling Apple TVs in Node-RED.

Supported models are:
* Apple TV HD (Apple TV 4)
* Apple TV 4K

Thanks Lukas Rögner [homebridge-apple-tv-remote](https://github.com/lukasroegner/homebridge-apple-tv-remote) and stickpin [node-appletv-x](https://github.com/stickpin/node-appletv-x)

### Pairing
-   Drag ATV input onto the canvas and select 'Add new atvx-config'
-   Once the config editor loads, wait until a list of Apple TV devices on your network appear in the dropdown
-   Select your device from the dropdown and click "Initiate Connection"
-   Once the pairing code appears on your Apple TV, enter it in the Pin field and press the submit button to the right
-   On a successful pairing, a string will appear in the Apple TV Token field
-   Save and deploy

### Output
A very simple node that takes the following commands as a string on msg.payload
-   Up
-   Down
-   Left
-   Right
-   Menu
-   Play
-   Pause
-   Next
-   Previous
-   Suspend
-   Select
-   LongTv
-   Tv
-   Wake
-   Home
-   VolumeUp
-   VolumeDown

### Input
Events from Apple TV on msg.payload
```
{
    "isOn": true|false,
    "isPlaying": true|false
    "currentApp": "<bundleIdentifier>"
}
```