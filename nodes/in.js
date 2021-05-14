module.exports = function (RED) {
  'use strict';
  const _ = require('lodash/object');

  function ATVxIn(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.token);
    this.isOn = false;
    this.isPlaying = false;
    this.currentApp = '';

    let node = this;
    node.status({});

    function isOn(payload) {
      // If the Apple TV is not a proxy for AirPlay playback, the logicalDeviceCount determines the state
      if (payload.logicalDeviceCount > 0 && !payload.isProxyGroupPlayer) {
        return true;
      }
      // If the Apple TV is a proxy for AirPlay playback, the logicalDeviceCount and the AirPlay state determine the state
      if (payload.logicalDeviceCount > 0 && payload.isProxyGroupPlayer && payload.isAirplayActive) {
        return true;
      }
      return false;
    }

    function isPlaying(payload) {
      // Gets the new playing state
      return payload.playbackState == 1;
    }

    node.onStatus = function (obj) {
      if (obj) {
        node.status({ fill: `${obj.color}`, shape: "dot", text: `${obj.text}` });
      }
    }

    node.onMessage = function (msg) {
      if (msg && typeof (msg.payload) !== 'undefined') {
        if (msg.type == 4) {
          node.isPlaying = isPlaying(msg.payload);
        }
        if (msg.type == 15) {
          node.isOn = isOn(msg.payload);

          if (node.isOn === false) {
            node.isPlaying = false;
          }
        }

        node.currentApp = _.get(msg.payload, 'playerPath.client.bundleIdentifier', node.currentApp);

        node.send({ payload: { isOn: node.isOn, isPlaying: node.isPlaying, currentApp: node.currentApp } });
      }
    }

    if (node.controller) {
      node.onStatus({ "color": "grey", "text": "initiate ..." });
      node.controller.on('updateStatus', node.onStatus);
      node.controller.on('updateMessage', node.onMessage);
    }
  }
  RED.nodes.registerType("atvx-in", ATVxIn);
}