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

    this.on("input", function (msg, send, done) {
      let start = new Date().getTime();

      function _return(error) {
        if (
          node.skip_deprecated &&
          error.toString().match(/pyatv.*DeprecationWarning/i)
        ) {
          error = false;
        }
        if (error) {
          node.onStatus({ color: "red", text: "error" });
          node.error(error);
        } else {
          let elapsed = (new Date().getTime()) - start;
          msg.playload = {
            elapsed: elapsed
          };
          (send) ? send(msg) : node.send(msg);
          if (done) { done(); }
        }
      }

      if (node.atvxConfig.connect) {
        if (node.atvxConfig.backend == "pyatv-cli") {
          let payload = msg.payload.replace(/(?:^|\s|["'([{])+\S/g, (match) =>
            match.toLowerCase()
          );
          let command = payload.split("=")[0];
          if (typeof types_1.NodePyATVInternalKeys[payload] !== "undefined") {
            node.atvxConfig.connect.pressKey(payload).catch((error) => {
              _return(error);
            }).then(() => {
              _return()
            });
          } else if (
            ["play_url", "stream_file", "launch_app"].includes(command)
          ) {
            node.atvxConfig.connect._pressKey(
              payload,
              types_1.NodePyATVExecutableType.atvremote
            ).catch((error) => {
              _return(error);
            }).then(() => {
              _return()
            });
          } else {
            _return(`Unsupported command: ${payload}`);
          }
        }
      }
    });
  }
  RED.nodes.registerType("atvx-out", ATVxOut);
};
