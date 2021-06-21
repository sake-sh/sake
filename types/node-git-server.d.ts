const express = import("express");

interface GitAuthArgs {
  type: string;
  repo: string;
  username: string;
  password: string;
  headers: any;
}

type GitAuthMiddleware = (
  args: GitAuthArgs,
  next: express.NextFunction
) => Promise<void>;

declare module "node-git-server" {
  interface Options {
    autoCreate?: boolean;
    authenticate?: GitAuthMiddleware;
    checkout?: boolean;
  }

  class Git {
    constructor(path: string, options: Options);
    on(ev: string, cb: (args: any) => void);
    handle(req: express.Request, res: express.Response);
  }

  export = Git;
}
