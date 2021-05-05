'use strict';

const appletv_1 = require("node-appletv-x/dist/lib/appletv");

module.exports = function (RED) {
  function ATVXOut(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    node.controller = RED.nodes.getNode(config.token);
    node.status({});

    node.onStatus = function (obj) {
      if (obj) {
        node.status({ fill: `${obj.color}`, shape: "dot", text: `${obj.text}` });
      }
    }

    if (node.controller) {
      node.onStatus({"color": "grey", "text": "initiate ..."});
      node.controller.on('statusUpdate', node.onStatus);
    }

    node.on('input', function(msg) {
      if (node.controller.device) {
        let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
        let key = appletv_1.AppleTV.Key[command];
        if (typeof (key) !== 'undefined') {
          node.controller.device.sendKeyCommand(key);
        }
      }
    });

  }
  RED.nodes.registerType("atvx-out", ATVXOut);
}