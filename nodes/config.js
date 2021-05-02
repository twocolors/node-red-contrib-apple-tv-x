'use strict';

const ATVx = require('node-appletv-x');
// const mDnsSd = require('node-dns-sd');
// const _ = require('lodash/object');

module.exports = function (RED) {
  let pinCode = null;

  class ATVXConfig {
    constructor(config) {
      RED.nodes.createNode(this, config);

      let node = this;
      node.token = this.credentials.token;
      node.device = null;
      node.timer = null;
      node.heartbeat = null

      function statusUpdate(obj) {
        node.emit('statusUpdate', obj);
      }

      async function setConnect(token) {
        let credentials = ATVx.parseCredentials(token);
        let uniqueIdentifier = credentials.uniqueIdentifier;

        node.device = await ATVx.scan(uniqueIdentifier, 1.5)
          .then(devices => {
            statusUpdate({ "color": "yellow", "text": "connecting ..." });

            let device = devices[0];

            device.on('message', msg => {
              node.emit('messageUpdate', msg);
            });

            device.on('connect', () => {
              statusUpdate({ "color": "green", "text": "connected" });

              clearTimeout(node.timer);
            });

            device.on('close', () => {
              statusUpdate({ "color": "red", "text": "disconnected" });

              // heartbeat
              if (node.heartbeat) {
                clearInterval(node.heartbeat);
                node.heartbeat = null;
              }

              if (node.device) {
                node.device.closeConnection();
                node.device = null;
              }

              // reconnect
              node.timer = setTimeout(setConnect, 15 * 1000, node.token);
            });

            device.on('error', () => {
              // reconnect
              node.timer = setTimeout(setConnect, 15 * 1000, node.token);
            });

            return device.openConnection(credentials);
          })
          .catch(error => {
            // console.log(error);
            node.error('Bad token, re-Pairing Apple TV');
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
          node.heartbeat = setInterval(async function () {
            try {
              await node.device.sendIntroduction();
            } catch (_) { }
          }, 60 * 1000);
        }

        return node.device;
      }

      node.on('close', function () { pinCode = null });

      if (typeof (node.token) !== 'undefined') {
        setConnect(node.token);
      }
    }
  }

  RED.nodes.registerType("atvx-config", ATVXConfig, {
    credentials: {
      atv: { type: 'text' },
      token: { type: 'text' }
    }
  });

  // function _uid(device) {
  //   let uid = false
  //   let additionals = _.get(device, 'packet.additionals', false);
  //   if (additionals) {
  //     additionals.forEach(async (elm) => {
  //       let modelname = _.get(elm, 'rdata.ModelName', '');
  //       if (typeof (elm.type) !== 'undefined' && elm.type == 'TXT' && modelname.match(/apple/i)) {
  //         uid = _.get(elm, 'rdata.UniqueIdentifier', false);
  //       }
  //     });
  //   }
  //   return uid;
  // }

  RED.httpAdmin.get('/atvx/discover', (req, res) => {
    // mDnsSd.discover({ name: '_mediaremotetv._tcp.local', quick: true,
    // }).then((device_list) => {
    //   let devices = []

    //   device_list.forEach(async (device) => {
    //     let uid = _uid(device);
    //     if (uid) {
    //       devices.push({ name: device.modelName, uid: uid });
    //     }
    //   });

    //   res.json(devices);
    // });

    ATVx.scan(undefined, 1.5).then(device_list => {
      let devices = []

      device_list.forEach(async (device) => {
        devices.push({ name: device.name, uid: device.uid });
      });

      res.json(devices);
    });
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
      ATVx.scan(uniqueIdentifier, 1.5).then(devices => {

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
              }, 1500);
            });
          })
          .then(([callback, pinCode]) => {
            return callback(pinCode.toString());
          });

      })
        .then(device => {
          // you're paired!
          let credentials = device.credentials;
          if (credentials) {
            res.json({ token: credentials.toString() });
          }
          return device;
        })
        .then(device => {
          pinCode = null;
          device.closeConnection();
        })
        .catch(error => {
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