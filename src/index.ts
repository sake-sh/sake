import http from "http";
import { createApp } from "./app";
import { createGitHandler } from "./modules/git";
import { createWebhooksHandler } from "./webhooks";

const port = process.env.PORT || 3000;

const app = createApp();
const gitHandler = createGitHandler();
const webhooksHandler = createWebhooksHandler();

app.use(webhooksHandler);
app.use(gitHandler);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server listening on localhost:${port}`);
});
