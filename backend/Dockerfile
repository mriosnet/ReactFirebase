# ---- Build stage ----
FROM node:22-alpine AS backend
# Set working directory
WORKDIR /backend
# Install app dependencies
COPY package*.json ./
RUN npm install 
RUN npm ci

#  Make folder for persistent data
RUN mkdir -p /data
EXPOSE 4000
CMD ["npm", "start"]
# ...existing code...
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]