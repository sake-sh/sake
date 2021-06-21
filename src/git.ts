import { NextFunction, Request, Response } from "express";
import NodeGitServer from "node-git-server";
import NodeGit, { Commit, Repository, Treebuilder } from "nodegit";
import { resolve } from "path";
import { log } from "./util";

export const fixGitUrlMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  req.url = req.url.replace(/^\/((?:.(?!\.git))+?)\//, "/$1.git/");
  next();
};

export function createGitServer(
  repoPath: string,
  authenticate?: GitAuthMiddleware
) {
  const repos = new NodeGitServer(repoPath, {
    autoCreate: false,
    authenticate,
  });

  repos.on("push", (push: any) => {
    log("push", push.repo);
    push.accept();
  });

  repos.on("tag", (tag: any) => {
    log("tag", tag.repo);
    tag.accept();
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

  repos.on("head", (head: any) => {
    log("head", head.repo);
    head.accept();
  });

  return repos;
}

export class Barrel {
  private gr!: Repository;
  private builder!: Treebuilder;

  static async init(
    gitDir: string,
    repo: string,
    args: { committer: { name: string; email: string } }
  ) {
    const instance = await new Barrel(
      gitDir,
      repo,
      args.committer.name,
      args.committer.email
    ).openOrInitRepo();
    return instance;
  }

  private constructor(
    private gitDir: string,
    private repo: string,
    private committerName: string,
    private committerEmail: string
  ) {}

  // add or update file
  async updateAndCommitContent(path: string, content: string) {
    const commitOID = await this.changeRepoFiles(path, content);
    return commitOID;
  }

  private async openOrInitRepo() {
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
      this.gr = await NodeGit.Repository.init(repoPath, 1);
      const tree = await this.gr.getTree(
        await (await this.gr.index()).writeTree()
      );
      this.builder = await NodeGit.Treebuilder.create(this.gr, tree);
      await this.addOrUpdateFile("README.md", `# ${this.repo}`);
      await this.commitChanges(`init: create repo for github.com/${this.repo}`);
      return this;
    }
  }

  private async changeRepoFiles(path: string, content: string) {
    // TODO: follow default_branch
    const defaultBranch = "master";

    // push file content
    await this.addOrUpdateFile(path, content);

    // check diff
    const headCommit = await this.gr.getBranchCommit(defaultBranch);
    const oldTree = await headCommit.getTree();
    const newTree = await this.gr.getTree(await this.builder.write());
    const diff = await NodeGit.Diff.treeToTree(this.gr, oldTree, newTree, {
      flags:
        NodeGit.Diff.OPTION.INCLUDE_UNTRACKED |
        NodeGit.Diff.OPTION.IGNORE_FILEMODE,
    });
    const numDeltas = diff.numDeltas();

    if (numDeltas === 0) {
      return;
    }

    // commit changes
    const commitOID = await this.commitChanges(`update: ${path}`, headCommit);
    return commitOID;
  }

  private async addOrUpdateFile(filePath: string, fileContents: string) {
    const buf = Buffer.from(fileContents, "utf-8");
    const oid = await NodeGit.Blob.createFromBuffer(this.gr, buf, buf.length);
    await this.builder.insert(filePath, oid, NodeGit.TreeEntry.FILEMODE.BLOB);
  }

  private async commitChanges(message: string, parentCommit?: Commit) {
    const committer = NodeGit.Signature.now(
      this.committerName,
      this.committerEmail
    );

    const treeOID = await this.builder.write();

    return this.gr.createCommit(
      "HEAD",
      committer,
      committer,
      message,
      treeOID,
      parentCommit ? [parentCommit] : []
    );
  }

  private async getFileContents(filePath: string) {
    const headCommit = await this.gr.getBranchCommit("master");
    const tree = await headCommit.getTree();
    const fileEntry = await tree.entryByPath(filePath);
    return (await this.gr.getBlob(fileEntry.oid())).toString();
  }
}
