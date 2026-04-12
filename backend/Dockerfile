FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npm run migrate:prod && npm run start:prod"]
