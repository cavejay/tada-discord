const p = require("../loggerFactory")("api.guildHandler");

const { Response } = require("cottage");

// app.get("/api/guild/:gid", () => {});
// app.post("/api/guild/:gid", () => {});
// app.put("/api/guild/:gid", () => {});
// app.delete("/api/guild:gid", () => {});

module.exports = function Guild(db) {
  return {
    getGuild: async function (ctx, next) {
      p.info(`getGuild request for: ${ctx.request.params.gid}`);

      const resCursor = await db.run((r) => {
        return r.table("guilds").filter({ guildid: ctx.request.params.gid });
      });
      const res = await resCursor.toArray();

      return res;
    },
    updateGuild: async function (ctx, next) {
      p.info(`updateGuild request for: ${ctx.request.params.gid}`);
    },
    deleteGuild: async function (ctx, next) {
      p.info(`deleteGuild request for: ${ctx.request.params.gid}`);
      const res = await db.run((r) => {
        return r.table("guilds").filter({ guildid: ctx.request.params.gid }).delete();
      });
    },
    newGuild: async function (ctx, next) {
      p.info(`newGuild request for: ${ctx.request.params.gid}`);

      // Determine what this guild's default is
      const res = await db.run((r) => {
        p.info("about to create a new guild");
        return r.table("guilds").insert({
          guildid: ctx.request.params.gid,
        });
      });

      return new Response(200);
    },
  };
};
