FROM node:20-slim

# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
# Copy the schema before install so the postinstall `prisma generate` can find it.
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
