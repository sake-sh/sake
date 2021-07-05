import { Request, Response, NextFunction } from "express";
import { log } from "../util";

export function installation(req: Request, res: Response, next: NextFunction) {
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
