module.exports = function (RED) {
  'use strict';
  const appletv_1 = require("node-appletv-x/dist/lib/appletv");
  const tools_1 = require("@sebbo2002/node-pyatv/dist/lib/tools");
  const types_1 = require("@sebbo2002/node-pyatv/dist/lib/types");
  const exec = require('child_process').exec;

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.atvx);
    this.backend = this.controller.backend;

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
              node.onStatus({ "color": "red", "text": "error" });
              node.error(error);
            });
          } else {
            let parameters = tools_1.getParamters({
              id: node.controller.atv.split(';')[1],
              airplayCredentials: node.controller.token,
              companionCredentials: node.controller.companion
            }).join(' ');
            exec(`${types_1.NodePyATVExecutableType.atvremote} ${parameters} ${msg.payload}`, (error) => {
              if (error) {
                node.onStatus({ "color": "red", "text": "error" });
                node.error(error);
              }
            });
          }
        }
      }
    });

  }
  RED.nodes.registerType("atvx-out", ATVxOut);
}