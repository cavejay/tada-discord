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
        TADA_CONFIG_ENV: "container", // use config env 'container' for setting config via the environment
        NODE_ENV: "development",
        // All config related process environment vars can be found in config.container.js
      },
    },
  ],
};
