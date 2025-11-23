# Use Node.js Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and wget for health check
RUN npm ci --only=production && \
    apk add --no-cache wget

# Copy database and middleware files
COPY db.json .
COPY middleware.js .

# The node:alpine image already has a 'node' user (uid=1000, gid=1000)
# We'll use that instead of creating a new user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

# Run json-server
CMD ["npm", "start"]
