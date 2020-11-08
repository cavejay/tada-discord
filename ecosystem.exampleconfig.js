module.exports = {
  apps: [
    {
      name: "Tada-v1",
      script: "index.js",

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        TADA_CONFIG_ENV: "container",
        NODE_ENV: "development",
      },
    },
  ],
};
