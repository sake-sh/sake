import debug from "debug";
import { ProbotOctokit } from "probot";

export type Octokit = InstanceType<typeof ProbotOctokit>;

export const log = debug("sake");

export function isValidName(name: string): boolean {
  return !/[^A-Za-z0-9_-]/.test(name);
}
