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
ENV NODE_ENV=production
COPY config.default.js config.production.js

# start it
CMD ["node", "index.js"]