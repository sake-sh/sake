import assert from "assert";
import { join } from "path";

export const GIT_ROOT = process.env.GIT_ROOT!;
assert(GIT_ROOT, "GIT_ROOT missing");

export const SAKE_CONFIG_NAME = "sake.yml";

export const COMMITTER = {
  name: "sake.sh",
  email: "noreply@sake.sh",
};

export const TEMPLATES_ROOT =
  process.env.TEMPLATES_ROOT || join(__dirname, "..", "templates");

export const isDev = process.env.NODE_ENV === "development";
