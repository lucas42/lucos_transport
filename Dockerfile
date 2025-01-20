FROM node:23

WORKDIR /usr/src/app
COPY package* ./

RUN npm install

COPY src ./
RUN npm run build

ENV NODE_ENV production
ENV PORT 3000
EXPOSE $PORT

CMD [ "npm", "start" ]