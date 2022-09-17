const fs = require('fs');
const crypto = require('crypto');

module.exports = function (RED) {
  "use strict";

  const types_1 = require("@sebbo2002/node-pyatv/dist/lib/types");

  function ATVxOut(n) {
    RED.nodes.createNode(this, n);
    this.atvx = n.atvx;
    this.atvxConfig = RED.nodes.getNode(this.atvx);
    this.skip_deprecated = n.skip_deprecated;

    let node = this;

    node.shm = true;

    if (!fs.existsSync('/dev/shm')) {
      node.shm = false;
    }

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

      function _return(error, data, targetFile) {
        if (
          node.skip_deprecated &&
          error.toString().match(/pyatv.*DeprecationWarning/i)
        ) {
          error = false;
        }

        if (targetFile) {
          fs.unlinkSync(targetFile);
        }

        if (error) {
          node.onStatus({ color: "red", text: "error" });
          node.error(error);
        } else {
          let elapsed = (new Date().getTime()) - start;
          msg.payload = {
            data: data,
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

          let targetFile = false;
          if (payload == "stream" && msg.buffer) {
            let randomFileName = msg["_msgid"] + crypto.randomBytes(4).readUInt32LE(0);
            targetFile = (node.shm) ? "/dev/shm/" + randomFileName : "/tmp/" + randomFileName;
            fs.writeFileSync(targetFile, msg.buffer);
            payload = "stream_file=" + targetFile;
          }

          let command = payload.split("=")[0];
          if (typeof types_1.NodePyATVInternalKeys[payload] !== "undefined") {
            node.atvxConfig.connect.pressKey(payload).catch((error) => {
              _return(error, {}, targetFile);
            }).then((data) => {
              _return(false, data, targetFile)
            });
          } else {
            node.atvxConfig.connect._pressKey(
              payload,
              types_1.NodePyATVExecutableType.atvremote
            ).catch((error) => {
              _return(error, {}, targetFile);
            }).then((data) => {
              _return(false, data, targetFile)
            });
          }
        }
      }
    });
  }
  RED.nodes.registerType("atvx-out", ATVxOut);
};
