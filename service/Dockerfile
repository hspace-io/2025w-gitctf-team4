FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN mkdir -p /var/ctf
RUN cp ./flag /var/ctf/flag

EXPOSE 5000
CMD ["npm", "start"]
