const p = require("../loggerFactory")("api.database");

const r = require("rethinkdb");

class DBHandler {
  constructor({ cfg }) {
    this.databaseName = process.env.TADADB_NAME || "TadaDB";
    this.dbAddress = cfg.api.databaseAddr;
    this.dbPort = cfg.api.databasePort || "28015";
  }

  // Setup Connection and handle first time creation of resources if necessary
  async init() {
    try {
      this.conn = await r.connect({
        host: this.dbAddress,
        db: this.databaseName,
      });
      this.watchDBEvents(this.conn);
      p.info(`Successful database connection to: ${this.dbAddress}:${this.dbPort}`);
    } catch (e) {
      p.error(e);
    }

    await this.setupResources();

    return this;
  }

  async setupResources() {
    // Check the current Database and those available
    let dbList = await r.dbList().run(this.conn);
    if (!dbList.includes(this.databaseName)) {
      p.warn(`Database named '${this.databaseName}' is missing - proceeding to create`);
      await r
        .dbCreate(this.databaseName)
        .run(this.conn)
        .then((data) => {
          p.info(`Successfully created database '${data.config_changes[0]["new_val"].name}'`);
        })
        .catch((e) => p.error(e));
    }

    this.conn.use(this.databaseName);

    // Check the tables available
    let tableList = await r.db(this.databaseName).tableList().run(this.conn);
    const requiredTables = ["guilds", "users", "meta", "intros"];
    await Promise.all(
      requiredTables.map((table) => {
        if (!tableList.includes(table)) {
          p.warn(`Database '${this.databaseName}' missing table '${table}' - proceeding to create`);
          return r
            .tableCreate(table)
            .run(this.conn)
            .then((data) => {
              p.info(
                `Successfully created database table '${data.config_changes[0]["new_val"].name}' in database '${this.databaseName}'`
              );
            })
            .catch((e) => p.error(e));
        }
      })
    );

    // Determine if this is a virgin database by checking the metaTable
    const lastBoot = await r.table("meta").get(0).run(this.conn);
    if (!lastBoot) {
      // No last boot was recorded - setup meta table
      p.warn(`No metadata available for last boot - likely a first boot`);
    }
  }

  async wipeDB() {
    return await r.dbDrop(this.databaseName).run(this.conn);
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
