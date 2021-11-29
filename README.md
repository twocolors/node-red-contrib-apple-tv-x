
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
#### How to install pyatv [Official Documentation](https://pyatv.dev/documentation/#installing-pyatv)

#### How to install pyatv on Raspberry Pi [(Raspbian)](https://www.raspberrypi.com/software/)

```bash
$ sudo apt-get install build-essential libssl-dev libffi-dev python3-dev python3-pip python3-cryptography python3-wheel
$ sudo pip3 install --upgrade pyatv
```
#### How to install pyatv [(Official Node-RED Docker)](https://hub.docker.com/r/nodered/node-red)

**Exec to Docker use user !!! ROOT !!!**

```bash
$ docker exec -it --user root mynodered bash
```

in docker

```bash
docker$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o rust.sh && sh rust.sh -y && rm rust.sh && source $HOME/.cargo/env
docker$ apk add openssl-dev libffi-dev python3-dev
docker$ pip3 install --upgrade wheel pyatv
```

#### How to get Credentials AirPlay and Companion

```bash
$ atvremote --id 00:11:22:33:44:54 --protocol airplay pair
$ atvremote --id 00:11:22:33:44:54 --protocol companion pair
```

### Output
A very simple node that takes the following commands as a string on msg.payload

-   down
-   home
-   homeHold
-   left
-   menu
-   next
-   pause
-   play
-   playPause
-   previous
-   right
-   select
-   skipBackward
-   skipForward
-   stop
-   suspend
-   topMenu
-   up
-   volumeDown
-   volumeUp
-   wakeup

#### pyatv (python library) (experimental)

-   launch_app
-   play_url
-   turn_on
-   turn_off

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
