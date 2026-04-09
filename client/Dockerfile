# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend app using vite
# Pass dummy env var if necessary, though vite can take runtime vars sometimes, it usually bakes them at build time.
# We will use an environment variable substitution script in nginx if needed, or simply let the frontend hit the backend relative path or exposed nodeport. 
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Also copy a custom nginx config if we wanted routing, but default is fine if no client-side routing fallback is strictly required, though react-router requires fallback to index.html.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
