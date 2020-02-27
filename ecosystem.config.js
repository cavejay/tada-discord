module.exports = {
  apps: [
    {
      name: "Tada-Main",
      script: "index.js",

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {}
    }
  ]
};
