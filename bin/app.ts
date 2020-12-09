import { execSync } from "child_process";
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import PipelineStack from "../lib/stacks/pipeline";
import { ensureSecrets } from "../lib/utils";

console.log(process.env);

async function main() {
  await ensureSecrets();
  const gitHubBranch = execSync("git branch --show-current").toString().trim();
  const app = new App();
  new PipelineStack(app, `CDKSnackCICD-${gitHubBranch}`, {
    gitHubBranch,
    gitHubOwner: "shankben",
    gitHubRepository: "cdk-snack-cicd",
    gitHubTokenSecretId: "/CDKSnackCICD/GitHubAccessToken"
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
