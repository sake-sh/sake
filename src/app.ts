import express, { Request, Response, Express } from "express";
import { isDev } from "./constants";
import { log } from "./util";

function home(_req: Request, res: Response) {
  log("home");
  res.redirect("https://github.com/apps/sake-sh");
}

function installationSuccess(req: Request, res: Response) {
  const id = req.query.installation_id;
  const action = req.query.setup_action;
  log("installation", id, action);
  res.end(
    "Installation completed. Create a new release on configured repositories to generate a formula."
  );
}

function repoStub(req: Request, res: Response) {
  const repo = req.params.repo;
  log("repo stub", repo);
  if (isDev) {
    return res.end(`$ brew tap sake.sh/${repo} http://localhost:3000/${repo}`);
  }
  res.end(`$ brew tap sake.sh/${repo} https://sake.sh/${repo}`);
}

export function createApp({
  inject,
}: { inject?: (app: Express) => void } = {}) {
  const app = express();

  app.disable("x-powered-by");

  // inject middlewares
  if (inject) inject(app);

  // define routes
  app.get("/", home);
  app.get("/installation", installationSuccess);
  app.get("/:repo", repoStub);

  return app;
}
