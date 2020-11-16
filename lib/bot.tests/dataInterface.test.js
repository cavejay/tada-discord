const p = require("../loggerFactory")("bot.dataInterface");

const test = require("ava");
// const { init, cleanup } = require("ava-rethinkdb");

// Create the database :(
const databaseHost = process.env.DATABASE_HOST || "192.168.1.170";
const databasePort = process.env.DATABASE_PORT || "28015";

// test.before(async (t) => {
//   t.context.db = await d.init(true);
// });

// test.after(async (t) => {
//   await d.wipeDB();
// });

test("Reset() actually resets data", async (t) => {});

test("meta.lastUpdater updates correctly", async (t) => {});
