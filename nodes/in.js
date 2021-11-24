module.exports = function (RED) {
  'use strict';
  const _ = require('lodash/object');

  function ATVxIn(n) {
    RED.nodes.createNode(this, n);

    this.controller = RED.nodes.getNode(n.atvx);
    this.backend = this.controller.backend;
    this.state = {
      dateTime: null,
      hash: null,
      mediaType: null,
      deviceState: null,
      title: null,
      artist: null,
      album: null,
      genre: null,
      totalTime: null,
      position: null,
      shuffle: null,
      repeat: null,
      app: null,
      appId: null,
      powerState: null
    }

    let node = this;
    node.status({});

    function isOn(payload) {
      // If the Apple TV is not a proxy for AirPlay playback, the logicalDeviceCount determines the state
      if (payload.logicalDeviceCount > 0 && !payload.isProxyGroupPlayer) {
        return 'on';
      }
      // If the Apple TV is a proxy for AirPlay playback, the logicalDeviceCount and the AirPlay state determine the state
      if (payload.logicalDeviceCount > 0 && payload.isProxyGroupPlayer && payload.isAirplayActive) {
        return 'on';
      }
      return 'off';
    }

    function isPlaying(payload) {
      // Gets the new playing state
      return payload.playbackState == 1 ? 'playing' : 'stopped';
    }

    node.onStatus = function (obj) {
      if (obj) {
        node.status({ fill: `${obj.color}`, shape: "dot", text: `${obj.text}` });
      }
    }

    node.onMessageNative = function (msg) {
      if (msg && typeof (msg.payload) !== 'undefined') {
        if (msg.type == 4) {
          node.state.deviceState = isPlaying(msg.payload);
        }
        if (msg.type == 15) {
          node.state.powerState = isOn(msg.payload);

          if (node.state.powerState == 'off') {
            node.state.deviceState = 'idle';
          }
        }

        node.state.appId = _.get(msg.payload, 'playerPath.client.bundleIdentifier', node.currentApp);

        node.send({ payload: node.state });
      }
    }

    node.onMessagePyatv = function (msg) {
      _.merge(node.state, msg);
      node.send({ payload: node.state });
    }

    if (node.controller) {
      node.onStatus({ "color": "grey", "text": "initiate ..." });
      node.controller.on('updateStatus', node.onStatus);
      node.controller.on('updateMessage', (node.backend == 'native' ? node.onMessageNative : node.onMessagePyatv));
    }
  }
  RED.nodes.registerType("atvx-in", ATVxIn);
}