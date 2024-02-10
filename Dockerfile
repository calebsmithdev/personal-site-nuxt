# Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/

RUN npm install
ADD . /app
RUN npm run build

# Start final image
FROM node:20-alpine

WORKDIR /app

# Copy over build files from builder step
COPY --from=builder /app/.output  app/.output
COPY --from=builder /app/.nuxt  app/.nuxt
COPY --from=builder /app/package.json  app/package.json

# Expose the host and port 3000 to the server
ENV HOST 0.0.0.0
EXPOSE 3000

# Run the build project with node
ENTRYPOINT ["node", ".output/server/index.mjs"]