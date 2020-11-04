const p = require("../loggerFactory")("api.introHandler");

const { Response } = require("cottage");

// app.get("/api/intro/:id", () => {});
// app.post("/api/intro/:id", () => {});
// app.put("/api/intro/:id", () => {});
// app.delete("/api/intro/:id", () => {});

module.exports = function Intro(db) {
  return {
    getIntro: async function (ctx, next) {
      p.info(`getIntro request for: ${ctx.request.params.id}`);
      const resCursor = await db.run((r) => {
        return r.table("intros").filter({ guildid: ctx.request.params.id });
      });
      const res = await resCursor.toArray();

      return res;
    },
    updateIntro: async function (ctx, next) {
      p.info(`updateIntro request for: ${ctx.request.params.id}`);
      return new Response(501);
    },
    deleteIntro: async function (ctx, next) {
      p.info(`deleteIntro request for: ${ctx.request.params.id}`);
      return new Response(501);
    },
    newIntro: async function (ctx, next) {
      p.info(`newIntro request for: ${ctx.request.params.id}`);
      return new Response(200);
    },
  };
};
