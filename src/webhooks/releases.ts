import { WebhookEvent, EventPayloads } from "@octokit/webhooks";
import { join } from "path";
import { COMMITTER, GIT_ROOT, isDev, TEMPLATES_ROOT } from "../constants";
import { generateFormula, Ingredient } from "../modules/formula";
import { Barrel } from "../modules/git";
import { isFreshVersion, parseRelease } from "../modules/github";
import { log } from "../util";

/**
 * [Webhook events and payloads - GitHub Docs](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#installation_repositories)
 */

export async function handleReleases(
  context: WebhookEvent<EventPayloads.WebhookPayloadRelease>
) {
  const { payload } = context;
  const { action, repository, release } = payload;
  const isPrerelease = release.prerelease;
  const isDraft = release.draft;
  const isPrivate = repository.private;

  console.log(context.name, action);

  if (isPrivate && !isDev) {
    return;
  }

  // only handle non-drafted, non-prerelease release
  if (isPrerelease || isDraft) {
    return;
  }

  // collect repo data
  const ingredient = await collectIngredientFromReleasePayload(payload);
  log(ingredient);

  // compare version and ignore if it is lower than previous one
  const formulaPath = `${ingredient.name}.rb`;
  const barrel = await Barrel.init(GIT_ROOT, ingredient.owner, {
    committer: COMMITTER,
  });
  const cached = await barrel.getVersion(formulaPath);
  console.log("present:", ingredient.version, "cached:", cached);
  if (!isFreshVersion(ingredient.version, cached)) {
    log("outdated version");
    return;
  }

  // generate formula
  const templatePath = join(TEMPLATES_ROOT, `${ingredient.type}.rb`);
  console.log(templatePath);
  const formula = generateFormula(templatePath, ingredient);

  if (!formula) {
    log("failed to generate formula");
    return;
  }

  // commit formula
  const commitOID = await barrel.updateAndCommitContent(formulaPath, formula);
  if (!commitOID) {
    console.log("No changes");
    return;
  }

  // cache current version
  await barrel.saveVersion(formulaPath, ingredient.version);

  console.log(
    `New commit: ${ingredient.name}@${
      ingredient.version
    } (${commitOID.toString()})`
  );
}

async function collectIngredientFromReleasePayload(
  payload: EventPayloads.WebhookPayloadRelease
) {
  const { repository, release } = payload;
  // TODO: use 'name' and 'version' from package.json if exists
  const { name, description } = repository;
  const owner = repository.owner.login;
  const homepage = repository.homepage || repository.html_url;

  const type = repository.language?.toLowerCase() ?? "generic";

  const { version, arch } = await parseRelease(release);

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
