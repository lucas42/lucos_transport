FROM node:8

WORKDIR /usr/src/app
COPY . .

RUN npm install
RUN npm build

ENV NODE_ENV production
ENV PORT 8080
EXPOSE $PORT

CMD [ "npm", "start" ]