import express, { Express } from "express";
import { getFormula, listFormulae } from "./routes/api";
import { badge, badgeWithCount } from "./routes/badge";
import { formula } from "./routes/formula";
import { home } from "./routes/home";
import { installation } from "./routes/installation";
import { repo } from "./routes/repo";

export function createApp({
  inject,
}: { inject?: (app: Express) => void } = {}) {
  const app = express();

  // inject middlewares
  if (inject) inject(app);

  /**
   * API
   */

  // list all formula
  app.get("/api/repos/:repo/formulae", listFormulae);

  // get specific formula
  app.get("/api/repos/:repo/formulae/:formula", getFormula);

  /**
   * Static pages
   */

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
