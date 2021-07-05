import { Context } from "probot";
import { log } from "../util";

export async function handleInstallation(context: Context<"installation">) {
  const { action, installation } = context.payload;
  console.log(context.name, action); // created,deleted,suspend,unsuspend
  const login = installation.account.login;
  const type = installation.account.type;
  const iid = installation.id;
  const selection = installation.repository_selection; // all or selected
  const repos = context.payload.repositories;

  if (action === "deleted") {
    // TODO: cleanup corresponding git repos when deleted
  }

  log(action, login, type, iid, selection);
}
