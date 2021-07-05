import { NextFunction, Request, Response } from "express";
import { GIT_ROOT, isDev } from "../constants";
import { log } from "../util";
import { Taproom } from "../modules/git";

export async function repo(req: Request, res: Response, next: NextFunction) {
  const repo = encodeURIComponent(req.params.repo);
  log("repo", repo);
  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  if (!formulae) return next();
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
