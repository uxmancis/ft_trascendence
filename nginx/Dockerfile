FROM nginx:1.27-alpine

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY certs /etc/nginx/certs

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["nginx", "-g", "daemon off;"]