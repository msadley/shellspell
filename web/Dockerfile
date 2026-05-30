# Stage 1: Development environment
FROM node:20-alpine AS development
WORKDIR /app

# Copy dependency files and install packages
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 2: Build the production assets
FROM development AS build
RUN npm run build

# Stage 3: Serve the built application with Nginx (Production)
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static build files from build stage to nginx html root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
