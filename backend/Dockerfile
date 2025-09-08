# ---- Build stage ----
FROM node:22-alpine AS nomina-app-backend
# Install git to clone repo and update all packages
RUN apk update && apk add --no-cache git

# Clone the repository
RUN git clone --branch main https://github.com/mriosnet/ReactFirebase.git /backend

# Set working directory
WORKDIR /backend

# Remove frontend to save space
RUN rm -rf ./frontend

RUN mv ./backend . 


# Install dependencies
RUN npm ci --no-audit --no-fund



RUN npm run build
RUN npm install -g serve

EXPOSE 4000

