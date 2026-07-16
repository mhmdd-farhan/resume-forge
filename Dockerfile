FROM node:22

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (using legacy-peer-deps to ignore conflicts)
RUN npm ci --legacy-peer-deps

# Copy schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync schema and start server
CMD npx prisma db push && npm run start
