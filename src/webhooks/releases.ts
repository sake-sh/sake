import { Release, ReleaseEvent } from "@octokit/webhooks-types";
import crypto from "crypto";
import fetch from "node-fetch";
import { join } from "path";
import { Context } from "probot";
import { PackageJson } from "type-fest";
import { COMMITTER, GIT_ROOT, isDev, TEMPLATES_ROOT } from "../constants";
import {
  Arch,
  Binaries,
  generateFormula,
  Ingredient,
  Lang,
} from "../modules/formula";
import { Barrel } from "../modules/git";
import { getConfig, getContent, isFreshVersion } from "../modules/github";
import { isValidName, log, Octokit } from "../util";

/**
 * [Webhook events and payloads - GitHub Docs](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#installation_repositories)
 */

export async function handleReleases(context: Context<"release">) {
  const { payload } = context;
  const octokit = context.octokit;
  const { action, repository, release } = payload;
  const isPrerelease = release.prerelease;
  const isDraft = release.draft;
  const isPrivate = repository.private;
  const defaultBranch = repository.default_branch;

  console.log(context.name, action);

  // do no handle private repo in production mode
  if (isPrivate && !isDev) {
    return;
  }

  // only handle non-drafted, non-prerelease release
  if (isPrerelease || isDraft) {
    return;
  }

  // only work on default branch
  if (defaultBranch !== context.payload.release.target_commitish) {
    return;
  }

  // collect repo data
  const ingredient = await collectIngredientFromReleasePayload(
    payload,
    octokit
  );
  log(ingredient);

  // check if there's assets to serve
  if (Object.keys(ingredient.lang).length === 0 && !ingredient.binaries) {
    console.log("no assets to serve. aborting.");
    return;
  }

  // compare version and ignore if it is lower than previous one
  const formulaName = ingredient.name;
  const formulaPath = `${formulaName}.rb`;
  const barrel = await Barrel.openOrInit(GIT_ROOT, ingredient.owner, {
    committer: COMMITTER,
  });
  const meta = await barrel.getMeta(formulaName);
  console.log("present:", ingredient.version, "cached:", meta.metaVersion);
  if (!isFreshVersion(ingredient.version, meta.metaVersion)) {
    console.log("outdated version");
    return;
  }

  // generate formula
  const templatePath = join(TEMPLATES_ROOT, `${ingredient.type}.rb`);
  const formula = generateFormula(templatePath, ingredient);

  if (!formula) {
    console.log("failed to generate formula");
    return;
  }

  // update formula file
  await barrel.addOrUpdateFile(formulaPath, formula);

  // update meta data
  await barrel.updateMeta(formulaName, {
    metaVersion: ingredient.version,
    ingredient,
  });

  const commitMessage = `update: ${ingredient.name}@${ingredient.version}`;

  // commit changes
  const commitOID = await barrel.commitChanges(commitMessage);
  if (!commitOID) {
    console.log("no changes");
    return;
  }

  console.log(`new commit: "${commitMessage}" ${commitOID.tostrS()}`);
}

/**
 * gather and fetch info and create a list of ingredients
 * throws error if validation failed
 * override priorities: general config < lang specific config < sake.yml config
 */
async function collectIngredientFromReleasePayload(
  payload: ReleaseEvent,
  octokit: Octokit
): Promise<Ingredient> {
  const { repository, release } = payload;

  // constants
  const owner = repository.owner.login;
  const repo = repository.name;
  const type = repository.language?.toLowerCase() ?? "generic";

  // meta
  let name = repo;
  const description = repository.description;
  const version = release.tag_name;
  const homepage = repository.homepage || repository.html_url;
  const license = repository.license?.name;
  const head = repository.clone_url;
  const tarballUrl = release.tarball_url;
  const binaries =
    type === "generic" ? await findBinaryAssets(release) : undefined;
  const tag = release.tag_name;
  const revision = release.target_commitish;

  const lang: Lang = {};

  // language specific actions
  if (type === "javascript" || type === "typescript") {
    console.log("js/ts project detected");

    lang.js = { needsBuild: false };

    try {
      const pkgJsonStr = await getContent({
        owner,
        repo,
        path: "package.json",
        octokit,
      });
      if (pkgJsonStr) {
        const pkgJson = JSON.parse(pkgJsonStr) as PackageJson;
        console.log("package.json", pkgJson);
        if (pkgJson.name) name = pkgJson.name;
        if (typeof pkgJson.bin === "object") name = Object.keys(pkgJson.bin)[0];
        if (pkgJson?.scripts?.build) {
          lang.js.needsBuild = true;
        }
      }
    } catch (err) {
      console.log("error while handling js/ts: " + err.message);
    }
  }

  // overwrite config
  const config = await getConfig({ owner, repo, octokit });
  console.log("config", config);
  if (config) {
    if (config.name && isValidName(config.name)) {
      name = config.name;
    }
  }

  // check validity
  if (!isValidName(name)) {
    throw new Error("Invalid name: " + name);
  }

  const ingredient = {
    type,
    version,
    name,
    description,
    owner,
    homepage,
    tarballUrl,
    binaries,
    head,
    license,
    tag,
    revision,
    lang,
  };

  return ingredient;
}

// find download urls of binary files
export async function findBinaryAssets(
  release: Release
): Promise<Binaries | undefined> {
  const assets: Binaries = {};
  for (const asset of release.assets) {
    if (/darwin|mac/i.test(asset.name)) {
      // macOS
      const isARM = /arm64/i.test(asset.name);
      const arch = isARM ? "arm64" : "amd64";
      const url = asset.browser_download_url;
      log("found darwin binary", url, arch);

      // calculate sha256 hash
      const buffer = await fetch(url).then((res) => res.buffer());
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

      const key = `darwin_${arch}` as Arch;
      assets[key] = {
        url,
        sha256,
      };
    }
  }

  return Object.keys(assets).length > 0 ? assets : undefined;
}

// try to locate artifact path
export function findArtifactPathFromPackageJson(
  pkgJson: PackageJson
): string | undefined {
  if (!pkgJson.bin) return undefined;

  let binary: string = "";
  if (typeof pkgJson.bin === "string") {
    binary = pkgJson.bin;
  } else {
    binary = Object.values(pkgJson.bin)[0];
  }

  return binary;
}
