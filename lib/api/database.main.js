const p = require("../loggerFactory")("api.database");

const r = require("rethinkdb");
const m = require("moment");

class DBHandler {
  constructor({ cfg }) {
    this.databaseName = process.env.TADADB_NAME || "TadaDB_v1";
    this.dbAddress = cfg.api.databaseAddr;
    this.dbPort = cfg.api.databasePort || "28015";
  }

  // Setup Connection and handle first time creation of resources if necessary
  async init(skipHealthReports = false) {
    try {
      this.conn = await r.connect({
        host: this.dbAddress,
        db: this.databaseName,
      });
      this.watchDBEvents(this.conn);
      p.info(
        `Successful database connection to: ${this.dbAddress}:${this.dbPort}`
      );
    } catch (e) {
      p.error(e);
    }

    await this.setupResources();

    // Update database w/ config or startup params
    let startDate = new Date() / 1;
    let res = await r
      .table("meta")
      .get(0)
      .update(
        {
          lastBoot: startDate,
          historicalBootups: r
            .table("meta")
            .get(0)("historicalBootups")
            .append(r.table("meta").get(0)("lastBoot")),
        },
        { nonAtomic: true }
      )
      .run(this.conn);
    p.debug(`Logged date of start up to database: ${m(startDate).format()}`);

    // This is where we need to perform health checks etc
    if (!skipHealthReports) {
      await this.dbcontentReport();
    } else {
      p.warn("Skipping Table health reports due to skipHealthReports == 1");
    }

    return this;
  }

  async setupResources() {
    // Check the current Database and those available
    let dbList = await r.dbList().run(this.conn);
    if (!dbList.includes(this.databaseName)) {
      p.warn(
        `Database named '${this.databaseName}' is missing - proceeding to create`
      );
      await r
        .dbCreate(this.databaseName)
        .run(this.conn)
        .then((data) => {
          p.info(
            `Successfully created database '${data.config_changes[0]["new_val"].name}'`
          );
        })
        .catch((e) => p.error(e));
    }

    this.conn.use(this.databaseName);

    // Check the tables available
    let tableList = await r.db(this.databaseName).tableList().run(this.conn);
    const requiredTables = [
      { name: "guilds", id: "guildid" },
      { name: "users", id: "userid" },
      { name: "meta" },
      { name: "intros", id: "hash" },
    ];
    await Promise.all(
      requiredTables.map((table) => {
        if (!tableList.includes(table.name)) {
          p.warn(
            `Database '${this.databaseName}' missing table '${table.name}' - proceeding to create`
          );

          let tableOptions = {};
          if (table.id) tableOptions["primaryKey"] = table.id;
          return r
            .tableCreate(table.name, tableOptions)
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
    const metaTableData = await r.table("meta").get(0).run(this.conn);
    if (!metaTableData) {
      // No last boot was recorded - setup meta table
      p.warn(`No metadata available for last boot - likely a first boot`);
      try {
        const res = await r
          .table("meta")
          .insert({
            id: 0,
            lastBoot: 0,
            historicalBootups: [],
          })
          .run(this.conn);
        p.info("Successfully created metadata table");
      } catch (e) {
        p.error({
          msg: "Failed to create the default metaData Table",
          error: e,
        });
      }
    }
  }

  async wipeDB() {
    return await r.dbDrop(this.databaseName).run(this.conn);
  }

  async dbcontentReport() {}

  async run(fn) {
    return await fn(r, this.conn).run(this.conn);
  }

  watchDBEvents(conn) {
    conn.on("error", (e) => p.error(e));
    conn.on("close", (d) => p.warn(`Database Connection is closing: ${d}`));
    conn.on("timeout", (d) =>
      p.warning(`Database Connection has timedout: ${d}`)
    );
    conn.on("connect", (d) =>
      p.info(`Connection to database has been successful: ${d}`)
    );
  }

  static async build({ cfg }) {
    let dbhandler = new DBHandler({ cfg });
    return await dbhandler.init();
  }
}

module.exports = DBHandler;
