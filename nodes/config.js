module.exports = function (RED) {
  'use strict';
  const atvx = require('node-appletv-x');

  let pinCode = null;

  function ATVxConfig(n) {
    RED.nodes.createNode(this, n);

    this.device = null;
    this.reconnect = null;
    this.heartbeat = null
    this.token = this.credentials.token;

    let node = this;

    node.updateStatus = function (obj) {
      node.emit('updateStatus', obj);
    }

    node.doConnect = async function (token) {
      let credentials = atvx.parseCredentials(token);
      let uniqueIdentifier = credentials.uniqueIdentifier;

      node.device = await atvx.scan(uniqueIdentifier, 1.5)
        .then(devices => {
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
            //   node.reconnect = setTimeout(node.doConnect, 15 * 1000, node.token);
            // }
          });

          device.on('error', () => {
            // reconnect
            if (!node.reconnect) {
              node.reconnect = setTimeout(node.doConnect, 15 * 1000, node.token);
            }
          });

          return device.openConnection(credentials);
        })
        .catch(error => {
          // console.log(error);
          node.error('Bad token (re-Pairing Apple TV) or Disconnected');
          // reconnect
          if (!node.reconnect) {
            node.reconnect = setTimeout(node.doConnect, 15 * 1000, node.token);
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

    if (this.token) {
      setTimeout(node.doConnect, 1.5 * 1000, this.token);
    }

    this.on('close', () => {
      pinCode = null;
    });
  }

  RED.nodes.registerType("atvx-config", ATVxConfig, {
    credentials: {
      atv: { type: 'text' },
      token: { type: 'text' }
    }
  });

  RED.httpAdmin.get('/atvx/discover', (req, res) => {
    if (req) {
      atvx.scan(undefined, 1.5).then(device_list => {
        let devices = []

        device_list.forEach(async (device) => {
          devices.push({ name: device.name, uid: device.uid });
        });

        res.json(devices);
      });
    }
  });

  RED.httpAdmin.get('/atvx/pincode', (req, res) => {
    if (req.query.pincode) {
      pinCode = req.query.pincode;
    }
    res.status(200).end();
  });

  RED.httpAdmin.get('/atvx/pair', (req, res) => {
    let uniqueIdentifier = req.query.atv.split(':')[1];

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