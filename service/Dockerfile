FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /var/ctf

COPY flag.txt /var/ctf/flag

RUN chmod 444 /var/ctf/flag

RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "server.js"]
