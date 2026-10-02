# QuickServe Multi-Stage Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and client manifests
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Stage 2: Lean Production Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package and install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built server and client artifacts
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/server.js"]
