# Using https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:12-alpine

WORKDIR /opt/tada-discord

# Copy across the package and install the things
COPY package*.json ./

# Install required packages for npm install and remove them after use
RUN apk --no-cache --virtual build-dependencies add \
  git \
  python \
  make \
  g++ \
  && npm install

# RUN npm install
#RUN npm ci --only=production

FROM node:12-alpine
WORKDIR /opt/tada-discord
COPY --from=0 /opt/tada-discord/ .

# Bring things across
COPY . .

# Update the config
ENV TADA_CONFIG_ENV default
COPY config.default.js .

# The other envvars that should be used (at minimum) - others are listed in the config.default.js file
# NODE_ENV: "development",
# TADA_API_DATABASEADDR: "0.0.0.0",
# TADA_API_DATABASEPORT: "28015",
# TADA_DISCORD_OWNER: "asdfsdfdsf",
# TADA_DISCORD_AUTH_CLIENT_ID: "asdfasdf",
# TADA_DISCORD_AUTH_CLIENT_SECRET: "asdfasdf",
# TADA_DISCORD_AUTH_BOT_TOKEN: "safsadf",

# start it
CMD ["node", "index.js"]