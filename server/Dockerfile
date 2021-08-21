FROM node:alpine

COPY . .
RUN npm install

EXPOSE 4000
ENTRYPOINT [ "npm", "run", "start" ]