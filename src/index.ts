import assert from "assert";
import http from "http";
import { join } from "path";
import { createApp } from "./app";
import { createGitServer, fixGitUrlMiddleware } from "./git";
import { isValidGitHubUser } from "./github";
import { createGitHubApps } from "./githubApps";
import { log } from "./util";

const GIT_ROOT = process.env.GIT_ROOT;
assert(GIT_ROOT, "GIT_ROOT missing");
const TEMPLATES_ROOT =
  process.env.TEMPLATES_ROOT || join(__dirname, "..", "templates");

const port = process.env.PORT || 3000;

async function isValidRepo(repo: string) {
  return await isValidGitHubUser(repo);
}

async function authenticate({ type, repo }: GitAuthArgs) {
  log("auth", type, repo);

  // const isValid = await isValidRepo(repo);
  const isValid = true;

  if (isValid) return;

  throw new Error("requested user/org is not existed on GitHub");
}

const gitHandler = createGitServer(GIT_ROOT, authenticate);

const githubAppsHandler = createGitHubApps({
  gitRoot: GIT_ROOT,
  templateRoot: TEMPLATES_ROOT,
});

const app = createApp({
  gitRoot: GIT_ROOT,
  templateRoot: TEMPLATES_ROOT,
  inject: (app) => {
    app.use((req, res) => githubAppsHandler(req, res));
    app.use(fixGitUrlMiddleware);
    app.use((req, res) => gitHandler.handle(req, res));
  },
});

const server = http.createServer(app);

server.listen(port, () => {
  log(`Server listening on localhost:${port}`);
});
