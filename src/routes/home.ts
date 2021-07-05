import { Request, Response } from "express";
import { log } from "../util";

export function home(_req: Request, res: Response) {
  log("home");
  res.redirect("https://github.com/apps/sake-sh");
}
