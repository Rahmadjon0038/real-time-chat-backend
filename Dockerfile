# Use official Node.js LTS image
FROM node:20-bookworm-slim

# Create app directory inside the container
WORKDIR /app

# Copy dependency definitions first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application source
COPY . .

# Provide sensible defaults; override at runtime if needed
ENV NODE_ENV=production \
    PORT=4444 \
    JWT_SECRET=change-me \
    DB_PATH=./chat.db

# Expose the HTTP port used by Express
EXPOSE 4444

# Start the server
CMD ["node", "server.js"]
