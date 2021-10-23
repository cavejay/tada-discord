const p = require("../loggerFactory")("api.guildUserHandler");

const { Response } = require("cottage");

// app.get("/api/user/:uid/guild/:gid", () => {});
// app.post("/api/user/:uid/guild/:gid", () => {});
// app.put("/api/user/:uid/guild/:gid", () => {});
// app.delete("/api/user/:uid/guild/:gid", () => {});

module.exports = function GuildUser(db) {
  return {
    getGuildUser: async function (ctx, next) {
      p.info(`getGuildUser request for: ${ctx.request.params.uid} in ${ctx.request.params.gid}`);

      const resCursor = await db.run((r) => {
        return r.table("users").filter({ userid: ctx.request.params.uid, guildid: ctx.request.params.gid });
      });
      const res = await resCursor.toArray();

      if (res.length === 0) {
        return new Response(404, "User Not Found")
      }

      return res;
    },
    updateGuildUser: async function (ctx, next) {
      p.info(`updateGuildUser request for: ${ctx.request.params.uid} in ${ctx.request.params.gid}`);
    },
    deleteGuildUser: async function (ctx, next) {
      p.info(`deleteGuildUser request for: ${ctx.request.params.uid} in ${ctx.request.params.gid}`);
      const res = await db.run((r) => {
        return r.table("users").filter({ userid: ctx.request.params.uid, guildid: ctx.request.params.gid }).delete();
      });
    },
    newGuildUser: async function (ctx, next) {
      p.info(`newGuildUser request for: ${ctx.request.params.uid} in ${ctx.request.params.gid}`);

      // Determine what this guild's default is
      const res = await db.run((r) => {
        p.info("about to create a new user");
        return r.table("users").insert({
          id: `${ctx.request.params.uid}-${ctx.request.params.gid}`,
          userid: ctx.request.params.uid,
          guildid: ctx.request.params.gid,
          status: "active",
          introid: "",
        });
      });

      return new Response(201, res);
    },
  };
};
