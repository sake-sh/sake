import { Request, Response } from "express";
import fs from "fs/promises";
import NodeGitServer from "node-git-server";
import NodeGit, { Commit, Repository, Treebuilder } from "nodegit";
import { join, resolve } from "path";
import { COMMITTER, GIT_ROOT } from "../constants";
import { log } from "../util";
import { Ingredient } from "./formula";

interface Committer {
  name: string;
  email: string;
}

interface Formula {
  name: string;
  sha: string;
}

interface Meta {
  metaVersion: string;
  ingredient?: Ingredient;
}

interface BarrelOptions {
  committer: Committer;
  branch?: string;
  create?: boolean;
}

const DEFAULT_META: Meta = {
  metaVersion: "0",
  ingredient: undefined,
};

export async function authenticate({ type, repo }: GitAuthArgs) {
  log("auth", type, repo);
  // TODO: need to authenticate anyway?
}

export function createGitHandler() {
  const repos = new NodeGitServer(GIT_ROOT, {
    autoCreate: false,
    authenticate,
  });

  repos.on("push", (push: any) => {
    log("push", push.repo);
    push.reject("403");
  });

  repos.on("tag", (tag: any) => {
    log("tag", tag.repo);
    tag.reject("403");
  });

  repos.on("info", (info: any) => {
    log("info", info.repo);
    info.accept();
  });

  repos.on("fetch", (fetch: any) => {
    log("fetch", fetch.repo);
    log(`fetch ${fetch.commit}`);
    fetch.accept();
  });

  return (req: Request, res: Response) => {
    req.url = req.url.replace(/^\/((?:.(?!\.git))+?)\//, "/$1.git/");
    repos.handle(req, res);
  };
}

export class Taproom {
  constructor(
    private gitDir: string,
    private defaultCommitter: Committer = COMMITTER
  ) {}

  async repos(): Promise<string[]> {
    const dir = (await fs.readdir(this.gitDir)).map((ent) =>
      ent.replace(/\.git$/, "")
    );
    return dir;
  }

  async exists(repo: string): Promise<boolean> {
    try {
      const stat = await fs.stat(join(this.gitDir, repo + ".git"));
      return stat.isDirectory();
    } catch (err) {
      return false;
    }
  }

  async getFormulae(repo: string) {
    const barrel = await this.openBarrel(repo);
    return barrel?.listFormulae();
  }

  async getFormulaMeta(repo: string, formula: string) {
    const barrel = await this.openBarrel(repo);
    return barrel?.getMeta(formula);
  }

  private openBarrel(
    repo: string,
    args: BarrelOptions = { committer: this.defaultCommitter }
  ) {
    const mergedArgs = Object.assign(
      { committer: this.defaultCommitter },
      args
    );
    return Barrel.open(this.gitDir, repo, mergedArgs);
  }
}

export class Barrel {
  private gr!: Repository;
  private builder!: Treebuilder;

  static async openOrInit(gitDir: string, repo: string, args: BarrelOptions) {
    const instance = await new Barrel(
      gitDir,
      repo,
      args.branch || "master",
      args.committer
    ).openRepo({ create: true });
    return instance!;
  }

  static async open(gitDir: string, repo: string, args: BarrelOptions) {
    const instance = await new Barrel(
      gitDir,
      repo,
      args.branch || "master",
      args.committer
    ).openRepo({ create: false });
    return instance;
  }

  private constructor(
    private gitDir: string,
    private repo: string,
    private branch: string,
    private defaultCommitter: Committer
  ) {}

  async listFormulae(): Promise<Formula[]> {
    const headCommit = await this.gr.getBranchCommit("master");
    const tree = await headCommit.getTree();
    const entries = tree
      .entries()
      .filter((entry) => /^[^\/]+\.rb$/.test(entry.name()))
      .map((entry) => ({
        name: entry.name().replace(/\.rb$/, ""),
        sha: entry.sha(),
      }));
    return entries;
  }

  async getMeta(formula: string): Promise<Meta> {
    const metaFilePath = this.getMetaFilePath(formula + ".rb");
    const meta = await this.getFileContents(metaFilePath);
    if (!meta) {
      await this.addOrUpdateAndCommitFile(
        metaFilePath,
        JSON.stringify(DEFAULT_META)
      );
      return DEFAULT_META;
    }
    return JSON.parse(meta);
  }

  async updateMeta(formula: string, meta: Meta) {
    const latestMeta = this.getMetaFilePath(formula + ".rb");
    await this.addOrUpdateFile(latestMeta, JSON.stringify(meta));
  }

  async addOrUpdateFile(filePath: string, fileContents: string) {
    const buf = Buffer.from(fileContents, "utf-8");
    const oid = await NodeGit.Blob.createFromBuffer(this.gr, buf, buf.length);
    await this.builder.insert(filePath, oid, NodeGit.TreeEntry.FILEMODE.BLOB);
  }

  async commitChanges(
    message: string,
    noParent: boolean = false,
    committer?: Committer
  ) {
    log("commitChanges");
    // check diff
    const parents = [];
    if (!noParent) {
      const headCommit = await this.gr.getBranchCommit(this.branch);
      const isChanged = await this.isChanged(this.branch, headCommit);
      if (!isChanged) return;
      parents.push(headCommit);
    }

    const sig = NodeGit.Signature.now(
      committer?.name ?? this.defaultCommitter.name,
      committer?.email ?? this.defaultCommitter.email
    );

    const treeOID = await this.builder.write();

    return this.gr.createCommit("HEAD", sig, sig, message, treeOID, parents);
  }

  private getMetaFilePath(path: string) {
    return `${path}.meta`;
  }

  private async openRepo({ create = false }: { create?: boolean } = {}) {
    log("openOrInitRepo", this.repo);
    const repoPath = resolve(this.gitDir, this.repo + ".git");
    try {
      // open
      this.gr = await NodeGit.Repository.openBare(repoPath);
      const headCommit = await this.gr.getBranchCommit("master");
      const tree = await headCommit.getTree();
      this.builder = await NodeGit.Treebuilder.create(this.gr, tree);
      return this;
    } catch (err) {
      // init
      if (!create) return;

      this.gr = await NodeGit.Repository.init(repoPath, 1);
      const tree = await this.gr.getTree(
        await (await this.gr.index()).writeTree()
      );
      this.builder = await NodeGit.Treebuilder.create(this.gr, tree);
      await this.addOrUpdateFile("README.md", "generated by https://sake.sh");
      await this.commitChanges(
        `init: create repo for github.com/${this.repo}`,
        true
      );
      return this;
    }
  }

  private async addOrUpdateAndCommitFile(path: string, content: string) {
    // push file content
    await this.addOrUpdateFile(path, content);

    // commit changes
    const commitOID = await this.commitChanges(`update: ${path}`);
    return commitOID;
  }

  private async isChanged(branch: string, commit: Commit) {
    const oldTree = await commit.getTree();
    const newTree = await this.gr.getTree(await this.builder.write());
    const diff = await NodeGit.Diff.treeToTree(this.gr, oldTree, newTree, {
      flags:
        NodeGit.Diff.OPTION.INCLUDE_UNTRACKED |
        NodeGit.Diff.OPTION.IGNORE_FILEMODE,
    });
    const numDeltas = diff.numDeltas();

    return numDeltas > 0;
  }

  private async getFileContents(filePath: string) {
    const headCommit = await this.gr.getBranchCommit("master");
    const tree = await headCommit.getTree();
    try {
      const fileEntry = await tree.entryByPath(filePath);
      return (await this.gr.getBlob(fileEntry.oid())).toString();
    } catch (err) {
      return undefined;
    }
  }
}
