import http from "http";
import { createApp } from "./app";
import { isDev } from "./constants";
import { createGitHandler } from "./modules/git";
import { createWebhooksHandler } from "./webhooks";
import helmet from "helmet";

const port = process.env.PORT || 3000;

const app = createApp({
  inject: (app) => {
    app.use(helmet());
  },
});
const gitHandler = createGitHandler();
const webhooksHandler = createWebhooksHandler();

if (!isDev) app.use(webhooksHandler);
app.use(gitHandler);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(
    `Server listening on localhost:${port} (${isDev ? "dev" : "prod"})`
  );
});
