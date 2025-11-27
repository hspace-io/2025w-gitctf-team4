FROM node:18

WORKDIR /app

RUN set -eux; \
    echo 'Acquire::AllowInsecureRepositories "true";' > /etc/apt/apt.conf.d/99insecure-repos; \
    echo 'Acquire::AllowDowngradeToInsecureRepositories "true";' >> /etc/apt/apt.conf.d/99insecure-repos; \
    echo 'APT::Get::AllowUnauthenticated "true";' >> /etc/apt/apt.conf.d/99insecure-repos; \
    apt-get update -qq --allow-insecure-repositories; \
    apt-get install -y -qq --allow-unauthenticated \
      python3 \
      python3-pip \
      python3-selenium \
      chromium \
      chromium-driver \
      netcat-traditional; \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /var/ctf /var/log && \
    cp flag /var/ctf/flag && \
    chmod 644 /var/ctf/flag

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
