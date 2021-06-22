import { readFileSync } from "fs";
import Handlebars from "handlebars";
import path from "path";
import { log } from "../util";

export interface Arch {
  url: string;
  sha256: string;
}

export type OS = "darwin" | "linux_intel" | "linux_arm64" | "linux_arm32";

export interface Ingredient {
  type: string;
  version: string;
  name: string;
  description: string | null;
  owner: string;
  homepage: string | null;
  arch: { [index: string]: Arch };
  dependencies?: string[];
  postinstall?: string[];
}

function split(word: string): string[] {
  return word.split(/[-_\s]+/);
}

function space(word: string): string {
  return split(trim(word)).join(" ");
}
Handlebars.registerHelper("space", space);

function trim(text: string) {
  return text.replace(/[\r\n]/g, "");
}
Handlebars.registerHelper("trim", trim);

function upper(text: string) {
  return trim(text).toUpperCase();
}
Handlebars.registerHelper("upper", upper);

function lower(text: string, options?: any) {
  const space = options && options.hash && options.hash.space;
  return trim(text).toLowerCase();
}
Handlebars.registerHelper("lower", lower);

function capital(text: string, options?: any) {
  const space = options && options.hash && options.hash.space;
  return split(trim(text))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(space ? " " : "");
}
Handlebars.registerHelper("capital", capital);

function camel(text: string) {
  return capital(text).replace(/^./, (s) => s.toLowerCase());
}
Handlebars.registerHelper("camel", camel);

function snake(text: string) {
  return capital(text)
    .replace(/(?<=([a-z](?=[A-Z])|[A-Za-z](?=[0-9])))(?=[A-Z0-9])/g, "_")
    .toLowerCase();
}
Handlebars.registerHelper("snake", snake);

function kebab(text: string) {
  return snake(text).replace(/_/g, "-");
}
Handlebars.registerHelper("kebab", kebab);

function basename(text: string | undefined) {
  if (!text) return text;
  return path.basename(text);
}
Handlebars.registerHelper("basename", basename);

export function generateFormula(scaffoldPath: string, args: Ingredient) {
  try {
    const scaffold = readFileSync(scaffoldPath, "utf-8");
    const template = Handlebars.compile(scaffold);
    return template(args);
  } catch (err) {
    log(err);
    return undefined;
  }
}
