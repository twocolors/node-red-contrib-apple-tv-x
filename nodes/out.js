module.exports = function (RED) {
  "use strict";

  const pyatv = require("@sebbo2002/node-pyatv");

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);
    this.atvx = n.atvx;
    this.atvxConfig = RED.nodes.getNode(this.atvx);
    this.skip_deprecated = n.skip_deprecated;

    let node = this;

    node.status({});

    node.onStatus = function (obj) {
      if (obj) {
        node.status({
          fill: `${obj.color}`,
          shape: "dot",
          text: `${obj.text}`,
        });
      }

      setTimeout(() => {
        node.status({});
      }, 3.5 * 1000);
    };

    this.on("input", function (msg) {
      if (node.atvxConfig.connect) {
        if (node.atvxConfig.backend == "pyatv-cli") {
          let payload = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, (match) =>
            match.toLowerCase()
          );
          let command = payload.split("=")[0];
          if (typeof pyatv.NodePyATVInternalKeys[payload] !== "undefined") {
            node.atvxConfig.connect.pressKey(payload).catch((error) => {
              _errorCli(error);
            });
          } else if (
            ["play_url", "stream_file", "launch_app", "set_volume"].includes(command)
          ) {
            node.atvxConfig.connect._pressKey(
              payload,
              pyatv.NodePyATVExecutableType.atvremote
            );
          } else {
            _errorCli(`Unsupported command: ${payload}`);
          }
        }
      }
    });

    function _errorCli(error) {
      if (error) {
        if (
          node.skip_deprecated &&
          error.toString().match(/pyatv.*DeprecationWarning/i)
        ) {
          return;
        }
        node.onStatus({ color: "red", text: "error" });
        node.error(error);
      }
    }
  }
  RED.nodes.registerType("atvx-out", ATVxOut);
};
