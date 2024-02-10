# Dockerfile
FROM node:20-alpine3.17

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

RUN npm run build
ENTRYPOINT ["node", ".output/server/index.mjs"]
# CMD [ "npm", "run", "start" ]