module.exports = function (RED) {
  'use strict';
  const atvx  = require('node-appletv-x');
  const pyatv = require('@sebbo2002/node-pyatv').default;
  const semver = require('semver');

  let pinCode = null;

  function ATVxConfig(n) {
    RED.nodes.createNode(this, n);

    this.device    = null;
    this.reconnect = null;
    this.heartbeat = null
    this.backend   = n.backend;
    this.atv       = this.credentials.atv;
    this.token     = this.credentials.token;
    this.companion = n.companion;

    let node = this;

    node.updateStatus = function (obj) {
      node.emit('updateStatus', obj);
    }

    node.doConnectNative = async function (token) {
      let credentials = atvx.parseCredentials(token);
      let uniqueIdentifier = credentials.uniqueIdentifier;

      node.device = await atvx.scan(uniqueIdentifier, 1.5).then(devices => {
        node.updateStatus({ "color": "yellow", "text": "connecting ..." });

        let device = devices[0];

        // emit message
        device.on('message', function (msg) {
          node.emit('updateMessage', msg);
        });

        // emit connect
        device.on('connect', () => {
          node.updateStatus({ "color": "green", "text": "connected" });

          // reconnect
          clearTimeout(node.reconnect);
        });

        // emit close
        device.on('close', () => {
          node.updateStatus({ "color": "red", "text": "disconnected" });

          // heartbeat
          if (node.heartbeat) {
            clearInterval(node.heartbeat);
            node.heartbeat = null;
          }

          // connect
          if (node.device) {
            node.device.closeConnection();
            node.device = null;
          }

          // reconnect
          // if (!node.reconnect) {
          //   node.reconnect = setTimeout(node.doConnectNative, 15 * 1000, node.token);
          // }
        });

        device.on('error', () => {
          // reconnect
          if (!node.reconnect) {
            node.reconnect = setTimeout(node.doConnectNative, 15 * 1000, node.token);
          }
        });

        return device.openConnection(credentials);
      }).catch(error => {
        // console.log(error);
        node.error('Bad token (re-Pairing Apple TV) or Disconnected');
        // reconnect
        if (!node.reconnect) {
          node.reconnect = setTimeout(node.doConnectNative, 15 * 1000, node.token);
        }
      });

      if (node.device) {
        try {
          await node.device.requestPlaybackQueue({
            location: 0,
            length: 1,
            includeMetadata: true,
            includeLyrics: true,
            includeLanguageOptions: true
          });
        } catch (_) { }

        // heartbeat
        node.heartbeat = setInterval(async () => {
          try {
            await node.device.sendIntroduction();
          } catch (_) { }
        }, 60 * 1000);
      }

      return node.device;
    }

    node.doDisconnectNative = async function () {
      if (node.device) {
        node.device.closeConnection();
        node.device = null;
      }
    }

    node.doConnectPyatv = async function (id, airplay, companion) {
      if (!node.device) {
        node.device = pyatv.device({id: id, airplayCredentials: airplay, companionCredentials: companion});
      }

      node.device.on('update', function (msg) {
        if (msg.values.key != 'dateTime') {
          node.updateStatus({ "color": "green", "text": "connected" });
        }
        let $key = msg.values.key;
        let $new = msg.values.new;

        let $msg = new Object;
        $msg[$key] = $new;

        node.emit('updateMessage', $msg);
      });

      // heartbeat
      node.heartbeat = setInterval(async () => {
        try {
          let msg = await node.device.getState();
          node.emit('updateMessage', msg);
        } catch (_) { }
      }, 60 * 1000);
    }

    node.doDisconnectPyatv = async function () {
      // heartbeat
      if (node.heartbeat) {
        clearInterval(node.heartbeat);
        node.heartbeat = null;
      }

      if (node.device) {
        node.device.off('update', () => {});
        node.device = null;
      }
    }

    // main
    if (node.atv && node.token) {
      if (node.backend == 'native') {
        setTimeout(node.doConnectNative, 1.5 * 1000, node.token);
      } else {
        let id = node.atv.split(';')[1];
        setTimeout(node.doConnectPyatv, 1.5 * 1000, id, node.token, node.companion);
      }
    }

    node.on('close', () => {
      pinCode = null;
      if (node.backend == 'native') {
        node.doDisconnectNative;
      } else {
        node.doDisconnectPyatv;
      }
    });
  }

  RED.nodes.registerType("atvx-config", ATVxConfig, {
    credentials: {
      atv: { type: 'text' },
      token: { type: 'text' }
    }
  });

  RED.httpAdmin.get('/atvx/discover', async (req, res) => {
    let backend = req.query.backend;
    let devices = [];
    if (backend == 'native') {
      atvx.scan(undefined, 1.5).then(device_list => {
        device_list.forEach(async (device) => {
          devices.push({ name: device.name, uid: device.uid });
        });
      });
    } else {
      const version = await pyatv.version();

      if (!version.pyatv) {
        res.json({ error: 'Unable to find pyatv. Is it installed?' });
        return;
      }

      if (semver.lt(version.pyatv, '0.9.0')) {
        res.json({ error: 'Found pyatv, but unforunately it\'s too old. Please update pyatv.' });
        return;
      }

      try {
        const device_list = await pyatv.find();
        device_list.forEach(async (device) => {
          devices.push({ name: device.options.name, uid: device.options.id });
        });
      } catch(error) {
        res.json({ error: error });
        return;
      }
    }
    res.json(devices);
  });

  RED.httpAdmin.get('/atvx/pincode', (req, res) => {
    let pincode = req.query.pincode;
    if (pincode) {
      pinCode = pincode;
    }
    res.status(200).end();
  });

  RED.httpAdmin.get('/atvx/pair', (req, res) => {
    let uniqueIdentifier = req.query.device.split(';')[1];

    if (uniqueIdentifier) {
      atvx.scan(uniqueIdentifier, 1.5).then(devices => {

        return devices[0].openConnection()
          .then(device => {
            return device.pair();
          })
          .then(callback => {
            return new Promise((resolve, reject) => {
              let poller = setInterval(() => {
                if (pinCode != null && pinCode.length == 4) {
                  clearInterval(poller);
                  resolve([callback, pinCode])
                }
              }, 1.5 * 1000);
            });
          })
          .then(([callback, pinCode]) => {
            return callback(pinCode.toString());
          });

      }).then(device => {
        // you're paired!
        let credentials = device.credentials;
        if (credentials) {
          res.json({ token: credentials.toString() });
        }
        return device;
      }).then(device => {
        pinCode = null;
        device.closeConnection();
      }).catch(error => {
        pinCode = null;
        let msg = 'Wrong PIN Code please try again "Initiate Connection"';
        if (typeof (error.message) !== 'undefined' && error.message.toString().match(/(attempt|rebooting)/i)) {
          msg = error.message;
        }
        res.json({ error: msg });
      });
    } else {
      res.json({});
    }
  });
}