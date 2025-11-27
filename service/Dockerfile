FROM node:22

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends php-cli \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /var/ctf \
    && cp flag /var/ctf/flag

EXPOSE 5000

CMD ["npm", "start"]