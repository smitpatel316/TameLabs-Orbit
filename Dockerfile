FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run web -- --port 5000
EXPOSE 5000
CMD ["npx", "serve", "-s", "web", "-l", "5000"]
