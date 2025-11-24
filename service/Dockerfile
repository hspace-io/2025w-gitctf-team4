FROM node:22

WORKDIR /app

COPY package*.json .

RUN npm install --omit=dev

EXPOSE 5000

CMD ["npm", "start"]

RUN mkdir -p /var/ctf
COPY flag /var/ctf/
