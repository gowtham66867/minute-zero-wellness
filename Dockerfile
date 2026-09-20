FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["sh", "-c", "node ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to /tmp/wrangler --ip 0.0.0.0 --port ${PORT:-8080}"]
