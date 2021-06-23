import { createNodeMiddleware, createProbot, Probot } from "probot";
import { isDev } from "../constants";
import { handleInstallation } from "./installation";
import { handleReleases } from "./releases";

/**
# push new commit with tag
push master refs/heads/master
push master refs/tags/v3
new tag v3 created null

# create release on github
release created
release prereleased|released
release published

# create draft release on github
release created
release prereleased|released

# edit release name on github
new tag v32 created null
push master refs/tags/v32

# make release to prerelease
release prereleased

# make prelease to release
release released
 */

const app = (app: Probot) => {
  console.log(`Webhooks started ${app.version} (${isDev ? "dev" : "prod"})`);

  app.on("installation", handleInstallation);
  app.on("release", handleReleases);
  app.on("push", ({ name, payload }) => {
    const { repository } = payload;
    const isPrivate = repository.private;
    if (isPrivate && !isDev) return;

    const defaultBranch = repository.default_branch;
    const ref = payload.ref;
    console.log(name, defaultBranch, ref);
  });

  // tag creation
  app.on("create", ({ name, payload }) => {
    const { repository } = payload;
    const isPrivate = repository.private;
    if (isPrivate && !isDev) return;

    const refType = payload.ref_type;
    const ref = payload.ref; // v2
    const description = payload.description;
    console.log("new", refType, ref, "created", description);
  });
  app.on("delete", (context) => {
    console.log("delete", context.name, context.payload);
  });
  app.on("meta", (context) => {
    console.log("meta", context.name);
    console.log("meta", context.payload);
  });
  app.on("repository", (context) => {
    console.log(context.name, context.payload);
  });
};

export default app;

export function createWebhooksHandler() {
  const probot = createProbot({
    overrides: {
      webhookPath: "/api/webhook",
    },
  });

  return createNodeMiddleware(app, { probot });
}
