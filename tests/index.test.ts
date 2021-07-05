import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

it("can redirect to github apps", async () => {
  await request(app)
    .get("/")
    .expect("location", "https://github.com/apps/sake-sh");
});
