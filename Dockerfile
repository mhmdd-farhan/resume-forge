FROM node:22

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (npm install — no committed lockfile; it is generated
# on a real `npm install` run by the operator, per README)
RUN npm install --legacy-peer-deps

# Copy schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining source code
COPY . .

# Build application (adapter-auto falls back to adapter-node on bare Node)
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync schema and start server
CMD npx prisma db push && node build/index.js