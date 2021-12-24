module.exports = function (RED) {
  'use strict';
  const appletv_1 = require("node-appletv-x/dist/lib/appletv");
  const tools_1 = require("@sebbo2002/node-pyatv/dist/lib/tools");
  const types_1 = require("@sebbo2002/node-pyatv/dist/lib/types");
  const exec = require('child_process').exec;
  const re_ipv4 = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
  const re_mac  = /^[0-9a-f]{1,2}([\:])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/gi;

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.atvx);
    this.backend = this.controller.backend;
    this.config = n;

    let node = this;

    node.onStatus = function (obj) {
      if (obj) {
        node.status({ fill: `${obj.color}`, shape: "dot", text: `${obj.text}` });
      }

      setTimeout(() => {
        node.status({});
      }, 3.5 * 1000);
    }

    // if (node.controller) {
    //   node.onStatus({ "color": "grey", "text": "initiate ..." });
    //   node.controller.on('updateStatus', node.onStatus);
    // }

    this.on('input', function (msg) {
      if (node.controller.device) {
        if (node.backend == 'native') {
          let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
          let key = appletv_1.AppleTV.Key[command];
          if (typeof (key) !== 'undefined') {
            node.controller.device.sendKeyCommand(key);
          } else {
            node.onStatus({ "color": "red", "text": "error" });
            node.error(`Unsupported key value ${key}!`);
          }
        } else {
          let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, match => match.toLowerCase());
          let key = types_1.NodePyATVInternalKeys[command];
          if (typeof (key) !== 'undefined') {
            node.controller.device.pressKey(command).catch(error => {
              _error(error);
            });
          } else {
            let connect = {
              airplayCredentials: node.controller.token,
              companionCredentials: node.controller.companion
            };

            let atv = node.controller.atv.toString();
            if (atv.match(/;/i)) {
              connect['id'] = atv.split(';')[1];
            } else if (atv.match(re_ipv4)) {
              connect['host'] = atv;
            } else if (atv.match(re_mac)) {
              connect['id'] = atv;
            }

            let parameters = tools_1.getParamters(connect).join(' ');
            exec(`${types_1.NodePyATVExecutableType.atvremote} ${parameters} ${msg.payload}`, (error) => {
              _error(error);
            });
          }
        }
      }
    });

    function _error(error) {
      if (error) {
        if (node.config.skip_deprecated && error.toString().match(/pyatv.*DeprecationWarning/i)) {
          return;
        }
        node.onStatus({ "color": "red", "text": "error" });
        node.error(error);
      }
    }

  }
  RED.nodes.registerType("atvx-out", ATVxOut);
}