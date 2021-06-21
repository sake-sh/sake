import express, { Request, Response, Express } from "express";
import { join } from "path";
import fetch from "node-fetch";
import { Arch, generateFormula } from "./formula";
import { Barrel } from "./git";
import crypto from "crypto";
import { fetchLatestRelease, getRepo, getConfig } from "./github";
import { log } from "./util";

export function createApp({
  gitRoot,
  templateRoot,
  inject,
}: {
  gitRoot: string;
  templateRoot: string;
  inject: (app: Express) => void;
}) {
  function homeHandler(_req: Request, res: Response) {
    log("home");
    res.end("Barrel.sh");
  }

  /**
   * Repository event hook via GitHub Apps
   */
  async function repoHandler(req: Request, res: Response) {
    log("repoHandler");
    // TODO: token based auth

    const { owner, repo } = req.params;
    const data = await getRepo(owner, repo);
    if (!data) {
      return res.json({ ok: false, error: "repository not found" });
    }
    /**
     * Useful props: name, full_name, description, default_branch, node_id, language, homepage, html_url, updated_at, pushed_at, private, size, owner.login, owner.id, owner.type
     */

    // Overwrite config
    const config = await getConfig(owner, repo);
    if (config) {
      if (config.language) data.language = config.language;
    }

    const type = data.language?.toLowerCase() ?? "generic";

    const name = data.name;
    const description = data.description;
    const homepage = data.homepage || data.html_url;
    // TODO: get latest tag, tarball url, and its sha hash
    // TODO: scrape releases

    const latest = await fetchLatestRelease(owner, repo);
    const version = latest.tag_name;
    const arch: { [index: string]: Arch } = {};
    for (const asset of latest.assets) {
      if (/darwin|mac/i.test(asset.name)) {
        // macOS
        const url = asset.browser_download_url;
        const buffer = await fetch(url).then((res) => res.buffer());
        const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
        // TODO: calculate sha256
        arch["darwin"] = {
          url,
          sha256,
        };
      }
    }

    log("# Report");
    log(`type: ${type}`);
    log(`name: ${name}`);
    log(`description: ${description}`);
    log(`version: ${version}`);
    log(`homepage: ${homepage}`);
    log(`arch:`, arch);
    // log(`language: ${data.language}`);
    // log(`html_url: ${data.html_url}`);
    // log(`updated_at: ${data.updated_at}`);
    // log(`pushed_at: ${data.pushed_at}`);
    // log(`default_branch: ${data.default_branch}`);

    // TODO: generate <name>.rb from these config
    const ingredient = {
      name,
      description,
      version,
      homepage,
      arch,
    };
    const templatePath = join(templateRoot, `${type}.rb`);
    const formulaPath = `${repo}.rb`;

    const formula = generateFormula(templatePath, ingredient);
    if (!formula) {
      return res.json({ ok: false, reason: `${type} is not supported` });
    }

    // commit formula
    const committer = { name: "Barrel", email: "noreply@barrel.sh" };
    const barrel = await Barrel.init(gitRoot, owner, {
      committer,
    });

    const commitOID = await barrel.updateAndCommitContent(formulaPath, formula);

    if (!commitOID) {
      log("No changes");
      return res.json({ ok: true });
    }

    log(`New commit: ${commitOID.toString()}`);
    res.json({ ok: true, oid: commitOID });
  }

  const app = express();

  app.disable("x-powered-by");

  // inject middlewares
  inject(app);

  // define routes
  app.get("/", homeHandler);
  // app.post("/:owner/:repo", repoHandler);

  return app;
}
