import express, { Request, Response, Express, NextFunction } from "express";
import { GIT_ROOT, isDev } from "./constants";
import { log } from "./util";
import { badgen } from "badgen";
import { Barrel, Taproom } from "./modules/git";

function home(_req: Request, res: Response) {
  log("home");
  res.redirect("https://github.com/apps/sake-sh");
}

function installation(req: Request, res: Response, next: NextFunction) {
  const id = req.query.installation_id;
  const action = req.query.setup_action;
  if (!id || !action) return next();
  log("installation", id, action);
  res.contentType("html");
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sake.sh</title>
  <style>
    html, body {
      height: 100%;
      font-family: sans-serif;
      flex-direction: column;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    h1 {
      font-size: 50pt;
    }

  </style>
</head>
<body>
<h1>🍶 sake.sh</h1>
<p>Installation completed. Create a new release on configured repositories to generate a formula.</p>
</body>
</html>`);
}

async function repo(req: Request, res: Response) {
  const repo = encodeURIComponent(req.params.repo);
  log("repo", repo);
  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  if (!formulae) return res.status(404).end();
  const hostname = isDev ? "http://localhost:3000" : "https://sake.sh";
  res.contentType("html");

  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sake.sh</title>
  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: sans-serif;
      text-align: center;
    }

    h1 {
      margin-top: 100px;
      font-size: 50pt;
    }

    pre {
      margin: 40px 0;
      padding: 40px;
      background: linear-gradient(128deg, #ffad73, #ff117e);
      font-size: 1.4em;
      white-space: break-spaces;
      color: white;
    }

    .select-all {
      -webkit-user-select: all;
      user-select: all;
    }

    .url {
      background: rgb(231, 231, 231);
      padding: 6px;
      background: rgb(231, 231, 231);
      border-radius: 2px;
    }

    .badge {
      margin: 5px;
    }

    .badge-box {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }

    ul {
      margin: 50px 0;
    }

    @media screen and (max-width: 700px) {
      h1 {
        font-size: 20pt;
      }

      pre {
        padding: 20px;
        font-size: 1em;
      }
    }
  </style>
</head>
<body>
<h1>🍶 sake.sh/${repo}</h1>

<pre><code>$ </code><code class="select-all">brew tap sake.sh/${repo} ${hostname}/${repo}</code></pre>

<ul>
${formulae
  .map(
    (formula) =>
      `<li><a href="${hostname}/${repo}/${formula.name}">${formula.name}</a></li>`
  )
  .join("\n")}
</ul>

<div class="badge-box">
<img class="badge" src="${hostname}/${repo}/badge.svg" alt="sake.sh badge" />
<code class="url select-all">[![sake.sh badge](${hostname}/${repo}/badge.svg)](${hostname}/${repo})</code>
</div>
<div class="badge-box">
<img class="badge" src="${hostname}/${repo}/badge/count.svg" alt="sake.sh badge" />
<code class="url select-all">[![sake.sh badge with counts](${hostname}/${repo}/badge/count.svg)](${hostname}/${repo})</code>
</div>

</body>
</html>
`);
}

async function formula(req: Request, res: Response) {
  const repo = encodeURIComponent(req.params.repo);
  const formula = encodeURIComponent(req.params.formula);
  log("formula", repo, formula);
  const room = new Taproom(GIT_ROOT);
  const meta = await room.getFormulaMeta(repo, formula);
  if (!meta) return res.status(404).end();

  const hostname = isDev ? "http://localhost:3000" : "https://sake.sh";
  res.contentType("html");

  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sake.sh</title>
  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: sans-serif;
      text-align: center;
    }

    h1 {
      margin-top: 100px;
      font-size: 50pt;
    }

    pre {
      margin: 40px 0;
      padding: 40px;
      background: linear-gradient(128deg, #ffad73, #ff117e);
      font-size: 1.4em;
      white-space: break-spaces;
      color: white;
    }

    .select-all {
      -webkit-user-select: all;
      user-select: all;
    }

    .url {
      background: rgb(231, 231, 231);
      padding: 6px;
      background: rgb(231, 231, 231);
      border-radius: 2px;
    }

    .badge {
      margin: 5px;
    }

    .badge-box {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }

    ul {
      margin: 50px 0;
    }

    @media screen and (max-width: 700px) {
      h1 {
        font-size: 20pt;
      }

      pre {
        padding: 20px;
        font-size: 1em;
      }
    }
  </style>
</head>
<body>
<h1>🍶 install ${formula}</h1>

<pre>
<code>$ </code><code class="select-all">brew tap sake.sh/${repo} ${hostname}/${repo}</code>
<code>$ </code><code class="select-all">brew install ${formula}</code>
</pre>

<h2>${meta.ingredient!.name} (${meta.ingredient!.version})</h2>

<div class="badge-box">
<img class="badge" src="${hostname}/${repo}/badge.svg" alt="sake.sh badge" />
<code class="url select-all">[![sake.sh badge](${hostname}/${repo}/badge.svg)](${hostname}/${repo})</code>
</div>
<div class="badge-box">
<img class="badge" src="${hostname}/${repo}/badge/count.svg" alt="sake.sh badge" />
<code class="url select-all">[![sake.sh badge with counts](${hostname}/${repo}/badge/count.svg)](${hostname}/${repo})</code>
</div>

</body>
</html>
`);
}

function badge(req: Request, res: Response) {
  log("badge");
  const repo = encodeURIComponent(req.params.repo);
  const isFlat = "flat" in req.query;

  const badge = badgen({
    subject: "homebrew tap",
    status: `sake.sh/${repo}`,
    color: "FF117E",
    style: isFlat ? "flat" : "classic",
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "maxage=86400");
  res.send(badge);
}

async function badgeWithCount(req: Request, res: Response) {
  const repo = req.params.repo;
  const isFlat = "flat" in req.query;

  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  if (!formulae) return res.status(404);

  const badge = badgen({
    subject: "formulae",
    status: `${formulae.length}`,
    color: "FF117E",
    style: isFlat ? "flat" : "classic",
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "maxage=86400");
  res.send(badge);
}

async function listFormulae(req: Request, res: Response) {
  log("listFormula");
  const repo = req.params.repo;
  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  res.setHeader("cache-control", "max-age=3600");
  res.json({ formulae });
}

async function getFormula(req: Request, res: Response) {
  log("getFormula");
  const { repo, formula } = req.params;
  const room = new Taproom(GIT_ROOT);
  const meta = await room.getFormulaMeta(repo, formula);
  res.setHeader("cache-control", "max-age=3600");
  res.json(meta);
}

export function createApp({
  inject,
}: { inject?: (app: Express) => void } = {}) {
  const app = express();

  // inject middlewares
  if (inject) inject(app);

  // list all formula
  app.get("/api/repos/:repo/formulae", listFormulae);

  // get specific formula
  app.get("/api/repos/:repo/formulae/:formula", getFormula);

  // define routes
  app.get("/", installation);
  app.get("/", home);

  // ui
  app.get("/:repo", repo);
  app.get("/:repo/badge(.svg)?", badge);
  app.get("/:repo/badge/count(.svg)?", badgeWithCount);

  app.get("/:repo/:formula", formula);

  return app;
}
