FROM node:15 as build

WORKDIR /app
COPY package.json /app
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:15 as runtime

WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/lib ./lib
COPY --from=build /app/templates ./templates
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "lib/index.js"]
