# Stage 1: Construcción de la aplicación React
FROM node:latest AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json (o yarn.lock) primero
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Stage 2: Servir la aplicación construida con un servidor web ligero (ejemplo: Nginx)
FROM nginx:latest

# Eliminar la configuración default de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar la configuración de Nginx personalizada (opcional, crea un archivo nginx.conf en tu proyecto)
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos de la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto en el que la aplicación será accesible (generalmente el puerto 80 para Nginx)
EXPOSE 80

# Comando para iniciar el servidor Nginx
CMD ["nginx", "-g", "daemon off;"]