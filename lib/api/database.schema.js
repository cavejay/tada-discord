// File to explain and record the expected schema of the various database tables

// https://github.com/ajv-validator/ajv

// Schema is written using the ajv style
const introExample = {
  filename: "tada.mp3",
  uploader: "181615330861252608",
  hash: "425fb23dc6ce6117954db4c8da2bd40a0bc37dbe21249c3cf5c33faa9766d024",
  soundData: "<unreadable>",
};
const intro = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "./intros.json",
  title: "Tada! Intro",
  description: "For storing in the rethinkdb",
  type: "object",
  properties: {
    hash: {
      type: "string",
    },
    filename: {
      type: "string",
    },
    soundData: {
      type: "array",
    },
    uploader: {
      type: "string",
    },
  },
};

const userExample = {};
const user = {
  $schema: "http://json-schema.org/schema#",
  $id: "users.json",
  title: "Tada! User",
  description: "For storing in the rethinkdb",
  type: "object",
  properties: {
    userid: {
      type: "string",
    },
    guilds: {
      type: "array",
      items: {
        $ref: "#/definitions/guildconfig",
      },
    },
  },
  definitions: {
    guildconfig: {
      type: "object",
      properties: {
        guildid: {
          type: "string",
        },
        introhash: {
          type: ["string", "null"],
        },
      },
    },
  },
};

const guildExample = {};
const guild = {
  $schema: "http://json-schema.org/schema#",
  $id: "guilds.json",
  title: "Tada! Guild",
  description: "For storing in the rethinkdb",
  type: "object",
  properties: {
    guildid: {
      type: "string",
    },
    defaultIntro: {
      type: "string",
    },
    maxTime: {
      type: "number",
    },
    prefix: {
      type: "string",
    },
    vipUsers: {
      type: "array",
      items: {
        $ref: "#/definitions/vipUser",
      },
    },
  },
  definitions: {
    vipUser: {
      type: "object",
      properties: {
        userid: {
          type: "string",
        },
        role: {
          type: "string",
        },
      },
    },
  },
};

module.exports = {
  intros,
  users,
  guild,
};
