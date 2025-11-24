FROM node:22-alpine

WORKDIR /app

COPY service/package*.json ./

RUN npm install --omit=dev

COPY service/. .

EXPOSE 5000

CMD ["npm", "start"]
