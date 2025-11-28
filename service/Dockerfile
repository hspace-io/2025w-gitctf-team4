FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --silent --no-progress > /tmp/npm-install.log 2>&1 \
    && echo "npm install done"

RUN apt-get update -qq && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
      python3 \
      python3-pip \
      chromium \
      chromium-driver > /tmp/apt-install.log 2>&1 && \
    rm -rf /var/lib/apt/lists/* && \
    echo "apt install done"

RUN python3 -m pip install --no-cache-dir --break-system-packages selenium \
      > /tmp/pip-install.log 2>&1 && \
    echo "pip selenium install done"

COPY . .

RUN mkdir -p /var/ctf /var/log && \
    cp flag /var/ctf/flag && \
    chmod 644 /var/ctf/flag

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/entrypoint.sh"]
