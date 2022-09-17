
# node-red-contrib-apple-tv-x

#### From version 1.0.0 remove support native control Apple TVs [(more)](https://github.com/lukasroegner/homebridge-apple-tv-remote/issues/105)


[![platform](https://img.shields.io/badge/platform-Node--RED-red?logo=nodered)](https://nodered.org)
[![Min Node Version](https://img.shields.io/node/v/node-red-contrib-apple-tv-x.svg)](https://nodejs.org/en/)
[![GitHub version](https://img.shields.io/github/package-json/v/twocolors/node-red-contrib-apple-tv-x?logo=npm)](https://www.npmjs.com/package/node-red-contrib-apple-tv-x)
[![GitHub stars](https://img.shields.io/github/stars/twocolors/node-red-contrib-apple-tv-x)](https://github.com/twocolors/node-red-contrib-apple-tv-x/stargazers)
[![Package Quality](https://packagequality.com/shield/node-red-contrib-apple-tv-x.svg)](https://packagequality.com/#?package=node-red-contrib-apple-tv-x)

[![issues](https://img.shields.io/github/issues/twocolors/node-red-contrib-apple-tv-x?logo=github)](https://github.com/twocolors/node-red-contrib-apple-tv-x/issues)
![GitHub last commit](https://img.shields.io/github/last-commit/twocolors/node-red-contrib-apple-tv-x)
![NPM Total Downloads](https://img.shields.io/npm/dt/node-red-contrib-apple-tv-x.svg)
![NPM Downloads per month](https://img.shields.io/npm/dm/node-red-contrib-apple-tv-x)
![Repo size](https://img.shields.io/github/repo-size/twocolors/node-red-contrib-apple-tv-x)

## About

Nodes for controlling Apple TVs in Node-RED (wrapper pyatv).

Thanks Pierre Ståhl for project [pyatv](https://github.com/postlund/pyatv)

Tested models are:
* Apple TV HD (Apple TV 4)
* Apple TV 4K

## Backend

### pyatv (cli)

#### How to install pyatv [Official Documentation](https://pyatv.dev/documentation/#installing-pyatv)

#### How to install pyatv on Raspberry Pi [(Raspbian)](https://www.raspberrypi.com/software/)

```bash
$ sudo apt-get install build-essential libssl-dev libffi-dev python3-dev python3-pip python3-cryptography python3-wheel
$ sudo pip3 install --upgrade pyatv
```
#### How to install pyatv [(Official Node-RED Docker)](https://hub.docker.com/r/nodered/node-red) based on Alpine Linux 3.12.9

#### Exec to Docker use user !!! ROOT !!!

```bash
$ docker exec -it --user root mynodered bash
```

in docker

```bash
docker$ apk add openssl-dev libffi-dev python3-dev py3-pip
docker$ pip3 install --upgrade wheel
docker$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o rust.sh && sh rust.sh -y && rm rust.sh && source $HOME/.cargo/env
docker$ pip3 install --upgrade pyatv
```

#### How to use pyatv in venv

[Creation of virtual environments](https://docs.python.org/3/library/venv.html) then in node **OUT** set Path where atvremote/atvscript

#### How to get Credentials AirPlay and Companion

```bash
$ atvremote --id 00:11:22:33:44:54 --protocol companion pair
$ atvremote --id 00:11:22:33:44:54 --protocol airplay pair
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
-   turnOff
-   turnOn

#### Experimental

 - play_url
 - stream_file
 - launch_app

##### play_url

Usage `play_url=https://www.example.com/mymovie.mp4` 

##### stream_file

Usage `stream_file=/tmp/myfile.mp4`

##### launch_app

Usage `launch_app=com.netflix.Netflix`

##### stream

This is a special command added for usage with NodeRED. This uses `stream_file` to play data from a buffer.

Example:

```
{
  payload: "stream",
  buffer: atob("UklGRqReAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YYBeAAAAAAAAAAAAAAAAAAAA....")
}
```

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
