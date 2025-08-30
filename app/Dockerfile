# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps separately for better caching
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# If a .env.production is present, CRA will pick up REACT_APP_* values at build time.
# Build the static assets to /app/build
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# Nginx conf for a React SPA with long-cache for hashed assets
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/build /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
