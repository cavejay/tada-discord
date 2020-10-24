// File to explain and record the expected schema of the various database tables

// https://github.com/ajv-validator/ajv

// Schema is written using the ajv style
const metaExample = {
  defaultIntroHash:
    "92553ef1e1e7f0fbc299ab64310cc492bc0b886b5cace2d0a6c207c18b8a8766",
  historicalBootups: [0, 1603365148005, 1603365246655],
  id: 0,
  lastBoot: 1603365697839,
  owner: "181615330861252608",
  defaultChannelConfig: {
    channelId: null,
    disabled: false,
    volume: 1,
  },
};
const meta = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "./intros.json",
  title: "Tada! Intro",
  description: "For storing in the rethinkdb",
  type: "object",
  properties: {
    defaultIntroHash: {
      type: "string",
    },
    historicalBootups: {
      type: "array",
      items: "number",
    },
    id: {
      type: "number",
    },
    lastBoot: { type: "number" },
    owner: { type: "number" },
    defaultChannelConfig: {
      type: object,
      properties: {
        channelId: { type: ["string", "null"] },
        disabled: { type: "boolean" },
        volume: { type: number },
      },
    },
  },
};

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

const userExample = {
  userid: uid,
  guilds: [
    {
      guildid: "alkdjflaksdjfsldfkjsdf",
      introhash: "4587651651321849876546132687979954544654",
    },
  ],
};
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

const guildExample = {
  defaultIntro:
    "92553ef1e1e7f0fbc299ab64310cc492bc0b886b5cace2d0a6c207c18b8a8766",
  guildid: "411102766929543178",
  maxIntroTime: 5000,
  prefix: "!tada ",
  vipUsers: null,
  channelConfig: [
    {
      channelId: "411102766929543182",
      disabled: false,
      volume: 0.8,
    },
    {
      channelId: "411102766929543182",
      disabled: true,
      volume: 1,
    },
  ],
  defaultChannelConfig: {
    channelId: null,
    disabled: false,
    volume: 1,
  },
};

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
    maxIntroTime: {
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
    channelConfig: {
      type: "array",
      items: {
        $ref: "#/definitions/channelConfig",
      },
    },
    availableIntros: {
      type: "array",
      items: {
        type: "string",
      },
    },
    defaultChannelConfig: {
      $ref: "#/definitions/channelConfig",
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
    channelConfig: {
      type: object,
      properties: {
        channelId: { type: ["string", "null"] },
        disabled: { type: "boolean" },
        volume: { type: number },
      },
    },
  },
};

module.exports = {
  meta,
  intros,
  users,
  guild,
};
