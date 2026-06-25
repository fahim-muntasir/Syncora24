# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# COPY package.json yarn.lock ./
# RUN corepack enable && yarn install --frozen-lockfile

# COPY . .

# RUN yarn build

# # Ensure dist/index.js has execution permissions
# RUN chmod +x dist/index.js 

# EXPOSE 8001

# CMD ["yarn", "start"]

FROM node:18-alpine

# Set working directory
WORKDIR /app

# install curl (and netcat for optional TCP checks)
RUN apk add --no-cache curl netcat-openbsd

# Copy package + lock first for Docker layer caching
COPY package.json yarn.lock ./

# Install dependencies
RUN corepack enable && yarn install --frozen-lockfile

# Copy app source
COPY . .

# Build
RUN yarn build

# Ensure dist/index.js has execution permissions (if applicable)
RUN chmod +x dist/index.js

# Set default env values (can be overridden by env_file)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8001

EXPOSE 8001

# Use yarn start as before. Ensure your start script respects HOST/PORT env.
CMD ["yarn", "start"]

