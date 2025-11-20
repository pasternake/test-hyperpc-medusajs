FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN npm run build

EXPOSE 9000

CMD ["npx", "medusa", "develop", "--host", "0.0.0.0"]
