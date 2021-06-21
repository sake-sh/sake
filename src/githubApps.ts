import { EventPayloads } from "@octokit/webhooks";
import { join } from "path";
import { createNodeMiddleware, createProbot, Probot } from "probot";
import { generateFormula } from "./formula";
import { Barrel } from "./git";
import { parseReleases } from "./github";

/**
 * [Webhook events and payloads - GitHub Docs](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#installation_repositories)
 */

async function collectIngredient(payload: EventPayloads.WebhookPayloadRelease) {
  const { repository } = payload;
  const { name, description } = repository;
  const owner = repository.owner.login;
  const homepage = repository.homepage || repository.html_url;

  const type = repository.language?.toLowerCase() ?? "generic";

  const { version, arch } = await parseReleases(owner, name);

  // Overwrite config
  // const config = await getConfig(owner, name);

  const ingredient = {
    type,
    version,
    name,
    description,
    owner,
    homepage,
    arch,
  };

  return ingredient;
}

export function createGitHubApps({
  gitRoot,
  templateRoot,
}: {
  gitRoot: string;
  templateRoot: string;
}) {
  async function commit(owner: string, formula: string, formulaPath: string) {
    const committer = { name: "Barrel", email: "noreply@barrel.sh" };

    const barrel = await Barrel.init(gitRoot, owner, {
      committer,
    });

    return await barrel.updateAndCommitContent(formulaPath, formula);
  }

  const app = (app: Probot) => {
    app.log.info("Yay, the app was loaded!");

    app.on("release", async ({ payload, log }) => {
      log("release");

      const ingredient = await collectIngredient(payload);
      log(ingredient);

      const templatePath = join(templateRoot, `${ingredient.type}.rb`);
      const formula = generateFormula(templatePath, ingredient);

      if (!formula) {
        log("no formula");
        return;
      }

      // commit formula
      const formulaPath = `${ingredient.name}.rb`;
      const commitOID = await commit(ingredient.owner, formula, formulaPath);

      if (!commitOID) {
        log("No changes");
        return;
      }

      log(`New commit: ${commitOID.toString()}`);
    });

    app.on(
      ["installation", "installation_repositories"],
      async ({ name, payload, log }) => {
        log("ok");
        log("installation", name);
        log((payload as any).repositories);
        const { action, sender, installation } = payload;
        const login = installation.account.login;
        const type = installation.account.type;
        const iid = installation.id;
        const selection = installation.repository_selection;
        log(action, sender, login, type, iid, selection);
      }
    );
  };

  const probot = createProbot({
    overrides: {
      webhookPath: "/api/webhook",
    },
  });

  return createNodeMiddleware(app, { probot });
}
