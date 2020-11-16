# Using https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:12

WORKDIR /opt/tada-discord

# Copy across the package and install the things
COPY package*.json ./
RUN npm install
#RUN npm ci --only=production

# Bring things across
COPY . .

# Update the config
ENV TADA_CONFIG_ENV container
COPY config.container.js .

# The other envvars that should be used (at minimum)
# NODE_ENV: "development",
# TADA_API_DATABASEADDR: "0.0.0.0",
# TADA_API_DATABASEPORT: "28015",
# TADA_DISCORD_OWNER: "asdfsdfdsf",
# TADA_DISCORD_AUTH_CLIENT_ID: "asdfasdf",
# TADA_DISCORD_AUTH_CLIENT_SECRET: "asdfasdf",
# TADA_DISCORD_AUTH_BOT_TOKEN: "safsadf",

# start it
CMD ["node", "index.js"]