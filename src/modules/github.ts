import crypto from "crypto";
import fetch from "node-fetch";
import { Octokit } from "octokit";
import { Arch, Binaries, BinaryAsset, Ingredient } from "./formula";
import { log } from "../util";
import semver from "semver";
import { WebhookEvent, EventPayloads } from "@octokit/webhooks";
import { SAKE_CONFIG_NAME } from "../constants";

export interface SakeConfig {
  language?: string;
}

export async function isValidGitHubUser(username: string) {
  // const octokit = new Octokit({auth: ''});
  const octokit = new Octokit({});

  const res = await octokit.rest.users.getByUsername({ username });
  return res.status === 200;
}

export async function getRepo(owner: string, repo: string) {
  // const octokit = new Octokit({auth: ''});
  const octokit = new Octokit({});

  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    if (res.status !== 200) return undefined;

    return res.data;
  } catch (err) {
    if (err.status === 404) {
      return undefined;
    }
    throw err;
  }
}

export async function getConfig(
  owner: string,
  repo: string
): Promise<SakeConfig | undefined> {
  // const octokit = new Octokit({auth: ''});
  const octokit = new Octokit({});

  try {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: SAKE_CONFIG_NAME,
    });
    if ("content" in res.data) {
      return JSON.parse(atob(res.data.content.replace(/\n/g, "")));
    } else {
      log("Couldn't find content");
      return undefined;
    }
  } catch (err) {
    if (err.status === 404) {
      return undefined;
    }
    throw err;
  }
}

export async function fetchLatestRelease(owner: string, repo: string) {
  // const octokit = new Octokit({auth: ''});
  const octokit = new Octokit();

  const releases = await octokit.rest.repos.listReleases({ owner, repo });

  const latest = releases.data.filter((release) => {
    return !release.draft && !release.prerelease;
  })[0];

  return latest;
}

export async function findBinaryAssets(
  release: EventPayloads.WebhookPayloadReleaseRelease
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

export function isFreshVersion(version: string, previous: string): boolean {
  version = version.replace(/^v/, "");
  previous = previous.replace(/^v/, "");
  try {
    return semver.gte(version, previous, {
      loose: true,
    });
  } catch (err) {
    // byte order comparison over non-semver
    return version >= previous;
  }
}
