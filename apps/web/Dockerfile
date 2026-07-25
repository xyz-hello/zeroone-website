FROM node:22-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL=/api
ARG REACT_APP_SITE_URL=https://zerooneitinc.com
ARG REACT_APP_CHAT_STORAGE_TTL_HOURS=24

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SITE_URL=$REACT_APP_SITE_URL
ENV REACT_APP_CHAT_STORAGE_TTL_HOURS=$REACT_APP_CHAT_STORAGE_TTL_HOURS

COPY package*.json ./
COPY apps/web/package*.json apps/web/

RUN npm ci --workspace apps/web --include-workspace-root=false

COPY apps/web apps/web

WORKDIR /app/apps/web

RUN npm run build

FROM nginx:1.27-alpine

COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
