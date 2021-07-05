import { NextFunction, Request, Response } from "express";
import { log } from "../util";
import { badgen } from "badgen";
import { Taproom } from "../modules/git";
import { GIT_ROOT } from "../constants";

export function badge(req: Request, res: Response) {
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

export async function badgeWithCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const repo = req.params.repo;
  const isFlat = "flat" in req.query;

  const room = new Taproom(GIT_ROOT);
  const formulae = await room.getFormulae(repo);
  if (!formulae) return next();

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
