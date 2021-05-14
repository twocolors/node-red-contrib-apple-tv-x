module.exports = function (RED) {
  'use strict';
  const appletv_1 = require("node-appletv-x/dist/lib/appletv");

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.token);

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
        let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
        let key = appletv_1.AppleTV.Key[command];
        if (typeof (key) !== 'undefined') {
          node.controller.device.sendKeyCommand(key);
        }
      }
    });

  }
  RED.nodes.registerType("atvx-out", ATVxOut);
}