module.exports = function (RED) {
  "use strict";

  function ATVxIn(n) {
    RED.nodes.createNode(this, n);
    this.atvx = n.atvx;
    this.atvxConfig = RED.nodes.getNode(this.atvx);

    if (!this.atvxConfig) return;

    let node = this;

    node.state = {
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
      powerState: null,
    };

    node.status({});

    node.onStatus = function (obj) {
      if (obj) {
        node.status({
          fill: `${obj.color}`,
          shape: "dot",
          text: `${obj.text}`,
        });
      }
    };

    node.onMessage = function (msg) {
      node.state = { ...node.state, ...msg };
      node.send({ payload: node.state });
    };

    node.onStatus({ color: "grey", text: "initiate ..." });
    node.atvxConfig.on("updateStatus", node.onStatus);
    node.atvxConfig.on("updateMessage", node.onMessage);

    node.on("close", () => {
      node.atvxConfig.removeListener("updateStatus", node.onStatus);
      node.atvxConfig.removeListener("updateMessage", node.onMessage);
    });
  }
  RED.nodes.registerType("atvx-in", ATVxIn);
};
