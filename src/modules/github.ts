import { ProbotOctokit } from "probot";
import semver from "semver";
import { SAKE_CONFIG_NAME } from "../constants";
import { log, Octokit } from "../util";

const DEFAULT_OCTOKIT = new ProbotOctokit();

export interface SakeConfig {
  name?: string;
  language?: string;
  versions?: {
    head?: boolean;
  };
}

export async function isValidGitHubUser(username: string) {
  const res = await DEFAULT_OCTOKIT.users.getByUsername({ username });
  return res.status === 200;
}

export async function getRepo(owner: string, repo: string) {
  try {
    const res = await DEFAULT_OCTOKIT.repos.get({ owner, repo });
    if (res.status !== 200) return undefined;

    return res.data;
  } catch (err) {
    if (err.status === 404) {
      return undefined;
    }
    throw err;
  }
}

interface GetContentOptions {
  owner: string;
  repo: string;
  path: string;
  octokit?: Octokit;
}
export async function getContent({
  owner,
  repo,
  path,
  octokit = DEFAULT_OCTOKIT,
}: GetContentOptions): Promise<string | undefined> {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    if ("content" in res.data) {
      return Buffer.from(
        res.data.content.replace(/\n/g, ""),
        "base64"
      ).toString();
    }
  } catch (err) {
    if (err.status === 404) {
      return undefined;
    }
    throw err;
  }
  return undefined;
}

interface GetConfigOptions {
  owner: string;
  repo: string;
  octokit?: Octokit;
}
export async function getConfig({
  owner,
  repo,
  octokit = DEFAULT_OCTOKIT,
}: GetConfigOptions): Promise<SakeConfig | undefined> {
  const content = await getContent({
    owner,
    repo,
    path: SAKE_CONFIG_NAME,
    octokit,
  });
  if (content) {
    return JSON.parse(content);
  } else {
    return undefined;
  }
}

export async function fetchLatestRelease(owner: string, repo: string) {
  const releases = await DEFAULT_OCTOKIT.repos.listReleases({ owner, repo });

  const latest = releases.data.filter((release) => {
    return !release.draft && !release.prerelease;
  })[0];

  return latest;
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
