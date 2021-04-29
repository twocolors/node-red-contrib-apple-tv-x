'use strict';

module.exports = function (RED) {
  function ATVXIn(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    node.controller = RED.nodes.getNode(config.token);
    node.isOn = false;
    node.isPlaying = false;
    node.currentApp = '';
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
        }

        if (typeof (msg.payload.playerPath.client.bundleIdentifier) !== 'undefined') {
          node.currentApp = msg.payload.playerPath.client.bundleIdentifier;
        }

        node.send({payload: {isOn: node.isOn, isPlaying: node.isPlaying, currentApp: node.currentApp}});
      }
    }

    if (node.controller) {
      node.onStatus({ "color": "grey", "text": "initiate ..." });
      node.controller.on('statusUpdate', node.onStatus);
      node.controller.on('messageUpdate', node.onMessage);
    }
  }
  RED.nodes.registerType("atvx-in", ATVXIn);
}