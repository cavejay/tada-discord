const p = require("../loggerFactory")("api.database");

const r = require("rethinkdb");

class DBHandler {
  constructor({ cfg }) {}

  async init() {
    try {
      this.conn = await r.connect({
        host: "192.168.1.170",
        db: "test",
      });
      this.watchDBEvents(this.conn);
      p.info("Database Connection complete");
    } catch (e) {
      p.error(e);
    }

    return this;
  }

  static async build({ cfg }) {
    let dbhandler = new DBHandler({ cfg });
    return await dbhandler.init();
  }

  watchDBEvents(conn) {
    conn.on("error", (e) => p.error(e));
    conn.on("close", (d) => p.warn(`Database Connection is closing: ${d}`));
    conn.on("timeout", (d) => p.warning(`Database Connection has timedout: ${d}`));
    conn.on("connect", (d) => p.info(`Connection to database has been successful: ${d}`));
  }
}

module.exports = DBHandler;
