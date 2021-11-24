module.exports = function (RED) {
  'use strict';
  const appletv_1 = require("node-appletv-x/dist/lib/appletv");

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.atvx);
    this.backend = this.controller.backend;

    let node = this;
    node.status({});

    node.onStatus = function (obj) {
      if (obj) {
        node.status({ fill: `${obj.color}`, shape: "dot", text: `${obj.text}` });
      }
    }

    if (node.controller) {
      node.onStatus({ "color": "grey", "text": "initiate ..." });
      node.controller.on('updateStatus', node.onStatus);
    }

    this.on('input', function (msg) {
      if (node.controller.device) {
        if (node.backend == 'native') {
          let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
          let key = appletv_1.AppleTV.Key[command];
          if (typeof (key) !== 'undefined') {
            node.controller.device.sendKeyCommand(key);
          }
        } else {
          let command = msg.payload;
          node.controller.device.pressKey(command).catch(error => {
            node.onStatus({ "color": "red", "text": "error" });
            node.error(error);
          });
        }
      }
    });

  }
  RED.nodes.registerType("atvx-out", ATVxOut);
}