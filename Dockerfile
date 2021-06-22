FROM node:15 as build

WORKDIR /app
COPY package.json /app
RUN yarn install
COPY . .
RUN yarn build

FROM node:15 as runtime

WORKDIR /app
COPY --from=build /app/package.json ./
RUN yarn install --prod
COPY --from=build /app/lib ./lib

CMD ["node", "lib/index.js"]