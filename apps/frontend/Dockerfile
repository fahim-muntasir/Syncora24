# FROM node:18-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 3000

# CMD [ "npm", "run", "dev" ]

# frontend/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# install curl (healthcheck needs it)
RUN apk add --no-cache curl
COPY --from=builder /app ./
# ensure start uses host 0.0.0.0 (next start accepts -H)
EXPOSE 3000
CMD ["sh","-c","npm run start -- -H 0.0.0.0 -p 3000"]

