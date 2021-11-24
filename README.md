
# node-red-contrib-apple-tv-x

## About

Nodes for controlling Apple TVs in Node-RED.

Tested models are:
* Apple TV HD (Apple TV 4)
* Apple TV 4K

## Backend

### native (no support tvOS 15)
Thanks Lukas Rögner [homebridge-apple-tv-remote](https://github.com/lukasroegner/homebridge-apple-tv-remote) and stickpin [node-appletv-x](https://github.com/stickpin/node-appletv-x)

#### Pairing
-   Drag ATV input onto the canvas and select 'Add new atvx-config'
-   Once the config editor loads, wait until a list of Apple TV devices on your network appear in the dropdown
-   Select your device from the dropdown and click "Initiate Connection"
-   Once the pairing code appears on your Apple TV, enter it in the Pin field and press the submit button to the right
-   On a successful pairing, a string will appear in the Apple TV Token field
-   Save and deploy

### pyatv (python library)
#### How to install pyatv

```bash
$ pip3 install pyatv
```
#### How to install pyatv [(Docker Alpine)](https://hub.docker.com/r/nodered/node-red)

```bash
$ docker exec -it --user root mynodered bash
$ wget -Oinit.sh https://sh.rustup.rs && sh init.sh -y && rm init.sh && source $HOME/.cargo/env
$ apk add python3-dev libffi-dev openssl-dev
$ pip3 install --upgrade git+https://github.com/postlund/pyatv.git
```

#### How to get Credentials AirPlay and Companion

```bash
$ atvremote --id 00:11:22:33:44:54 --protocol airplay pair
$ atvremote --id 00:11:22:33:44:54 --protocol companion pair
```

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
  dateTime: null,
  hash: null,
  mediaType: null,
  deviceState: null,
  title: null,
  artist: null,
  album: null,
  genre: null,
  totalTime: null,
  position: null,
  shuffle: null,
  repeat: null,
  app: null,
  appId: null,
  powerState: null
}
```