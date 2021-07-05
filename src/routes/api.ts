import { Request, Response } from "express";
import { GIT_ROOT } from "../constants";
import { Taproom } from "../modules/git";
import { log } from "../util";

export async function listFormulae(req: Request, res: Response) {
  log("listFormula");
  const repo = req.params.repo;
  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  res.setHeader("cache-control", "max-age=3600");
  res.json({ formulae });
}
export async function getFormula(req: Request, res: Response) {
  log("getFormula");
  const { repo, formula } = req.params;
  const room = new Taproom(GIT_ROOT);
  const meta = await room.getFormulaMeta(repo, formula);
  res.setHeader("cache-control", "max-age=3600");
  res.json(meta);
}
