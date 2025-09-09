FROM node:22-alpine AS raices-nomina-frontend
WORKDIR /frontend
COPY . .

RUN npm install
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=raices-nomina-frontend /frontend/build /usr/share/nginx/html
EXPOSE 80