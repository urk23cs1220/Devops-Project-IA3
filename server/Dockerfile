# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build/testing)
RUN npm install

# Copy source code
COPY . .

# In a more complex app, we might run build scripts here.
# For this Express app, we'll just prepare the production node_modules.

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies
COPY --from=build /app/package*.json ./
RUN npm install --only=production

# Copy app source
COPY --from=build /app/ .

# Expose backend port
EXPOSE 7000

# Start the server
CMD ["npm", "start"]
