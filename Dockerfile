FROM node:22-alpine

WORKDIR /usr/src/app

COPY service/package*.json ./

RUN npm ci --omit=dev

COPY service/. .

EXPOSE 5000

CMD ["npm", "start"]
