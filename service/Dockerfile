FROM node:18

WORKDIR /app

# PHP 설치
RUN apt-get update && apt-get install -y php-cli && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

# 플래그 파일 설정
RUN mkdir -p /var/ctf && \
    cp /app/flag.txt /var/ctf/flag && \
    chmod 444 /var/ctf/flag && \
    rm /app/flag.txt

EXPOSE 5000

CMD ["node", "server.js"]