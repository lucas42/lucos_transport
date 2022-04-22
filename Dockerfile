FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run-script build

ENV NODE_ENV production
ENV PORT 3000
EXPOSE $PORT

CMD [ "npm", "start" ]