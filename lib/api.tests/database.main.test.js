const p = require("../loggerFactory")("api.database");
const test = require("ava");

const TBDatabase = require("../api/database.main");

// Create the database :(
const databaseHost = process.env.DATABASE_HOST || "192.168.1.170";
const databasePort = process.env.DATABASE_PORT || "28015";
const d = new QSDatabase({
  host: databaseHost,
  port: databasePort,
  name: "test2",
});

test.before(async (t) => {
  t.context.db = await d.init(true);
});

test.after(async (t) => {
  await d.wipeDB();
});

test.todo("first test against database");
