module.exports = function (RED) {
  "use strict";

  const pyatv = require("@sebbo2002/node-pyatv").default;
  const semver = require("semver");
  const net = require("net");

  function ATVxConfig(n) {
    RED.nodes.createNode(this, n);
    this.backend = n.backend;
    this.path = n.path;
    this.url = n.url;
    this.identifier = this.credentials.identifier;
    this.companion = this.credentials.companion;
    this.airplay = this.credentials.airplay;
    this.debug = n.debug;

    let node = this;

    node.connect = null;
    node.heartbeat = null;

    node.updateStatus = function (obj) {
      node.emit("updateStatus", obj);
    };

    let onError = function (msg) {
      node.updateStatus({ color: "red", text: "error" });
      node.error(msg);
    };

    let onUpdateCli = function (event) {
      if (event.key != "dateTime") {
        node.updateStatus({ color: "green", text: "connected" });
      }
      node.emit("updateMessage", {[event.key]:event.value});
    };

    node.doConnectCli = async () => {
      if (!node.connect) {
        let options = {
          companionCredentials: node.companion,
          airplayCredentials: node.airplay,
          debug: node.debug,
        };
        if (node.path) {
          options.atvremotePath = `${node.path}/atvremote`;
          options.atvscriptPath = `${node.path}/atvscript`;
        }

        if (net.isIP(node.identifier)) {
          options.host = node.identifier;
        } else {
          options.id = node.identifier;
        }

        node.connect = pyatv.device(options);
      }

      node.connect.on("error", onError);
      node.connect.on("update", onUpdateCli);

      // heartbeat
      node.heartbeat = setInterval(async () => {
        try {
          let msg = await node.connect.getState();
          node.emit("updateMessage", msg);
        } catch (_) {}
      }, 60 * 1000);
    };

    node.doDisconnectCli = async () => {
      // heartbeat
      if (node.heartbeat) {
        clearInterval(node.heartbeat);
        node.heartbeat = null;
      }

      if (node.connect) {
        node.connect.off("error", onError);
        node.connect.off("update", onUpdateCli);
        node.connect = null;
      }
    };

    // main
    if (node.identifier) {
      if (node.backend == "pyatv-cli") {
        setTimeout(node.doConnectCli, 1.5 * 1000);
      }
    }

    // close
    node.on("close", async () => {
      if (node.backend == "pyatv-cli") {
        await node.doDisconnectCli();
      }
    });
  }

  RED.nodes.registerType("atvx-config", ATVxConfig, {
    credentials: {
      identifier: { type: "text" },
      companion: { type: "text" },
      airplay: { type: "text" },
    },
  });

  RED.httpAdmin.get("/atvx/scan", async (req, res) => {
    let backend = req.query.backend;
    let path = req.query.path;
    let url = req.query.url;
    let debug = req.query.debug == "true" ? true : false;
    let devices = [];

    if (backend == "pyatv-cli") {
      let options = {
        debug: debug,
      };
      if (path) {
        options.atvremotePath = `${path}/atvremote`;
        options.atvscriptPath = `${path}/atvscript`;
      }
      const version = await pyatv.version(options);

      if (!version.pyatv) {
        return res.json({ error: `Unable to find pyatv. Is it installed?` });
      }

      if (semver.lt(version.pyatv, "0.9.0")) {
        return res.json({
          error: `Found pyatv, but unforunately it's too old (${version.pyatv}). Please update pyatv.`,
        });
      }

      try {
        let list = await pyatv.find(options);
        list.forEach(async (device) => {
          devices.push({
            name: device.options.name,
            identifier: device.options.id,
            host: device.options.host,
          });
        });
      } catch (error) {
        return res.json({ error: error });
      }
    } else {
      return res.json({ error: `Unknown backend` });
    }

    return res.json(devices);
  });
};
