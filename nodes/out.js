module.exports = function (RED) {
  "use strict";

  const types_1 = require("@sebbo2002/node-pyatv/dist/lib/types");

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
          let command = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, (match) =>
            match.toLowerCase()
          );
          let key = types_1.NodePyATVInternalKeys[command];
          if (typeof key !== "undefined") {
            node.atvxConfig.connect.pressKey(command).catch((error) => {
              _errorCli(error);
            });
          } else if (
            ["play_url", "stream_file", "launch_app"].includes(
              command.split("=")[0]
            )
          ) {
            node.atvxConfig.connect._pressKey(
              command,
              types_1.NodePyATVExecutableType.atvremote
            );
          } else {
            _errorCli(`Unsupported command: ${command}`);
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
