var EventEmitter = require("events").EventEmitter;

const { KoalaEvent, EventRouter } = require("koala-event");

var emitter = new EventEmitter();

var eTest = new KoalaEvent();

// eTest.use(async (ctx, next) => {
//   let sTime = moment();
//   await next();
//   let duration = moment().diff(sTime, "ms");
//   console.log(`Event ${ctx.event} completed in ${duration}ms`);
// });

eTest.use(async function test1(ctx, next) {
  console.log("test1", ctx);
  await next();
});

emitter.emit = eTest.newEmitter(emitter);

emitter.emit("test", "hi");
emitter.emit("something", "else");
emitter.emit("something", "else again");

// allow middleware to be assigned to a specific event very similar to normal

console.log("\nother half\n");

var emitter = new EventEmitter();
const e = new EventRouter();

e.on("test", (ctx, next) => {
  console.log(ctx);
});

e.on("something", (ctx, next) => {
  ctx.secret = "hi";
  console.log(ctx);
  next();
});

e.on("something", (ctx, next) => {
  console.log(ctx.secret);
});

emitter.emit = e.newEmitter(emitter);

emitter.emit("test", "hi");
emitter.emit("something", "else");
emitter.emit("something", "again");
emitter.emit("nothing", 122);
