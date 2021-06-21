import crypto from "crypto";
import fetch from "node-fetch";
import { Octokit } from "octokit";
import { Arch } from "./formula";
import { log } from "./util";

export interface SakeConfig {
  language?: string;
}

const SAKE_CONFIG_NAME = "barrel.json";

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

export async function parseReleases(owner: string, name: string) {
  const latest = await fetchLatestRelease(owner, name);
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

  return { version, arch };
}
