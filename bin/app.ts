import fs from "fs";
import path from "path";
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import PipelineStack from "../lib/stacks/pipeline";
import { ensureSecrets } from "../lib/utils";

const pjp = path.join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(pjp).toString());
const {
  gitHubBranch,
  gitHubOwner,
  gitHubRepository,
  gitHubTokenSecretId
} = packageJson.config;

async function main() {
  await ensureSecrets();
  const props = {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.AWS_REGION ??
        process.env.CDK_DEPLOY_REGION ??
        process.env.CDK_DEFAULT_REGION ??
        "us-east-1"
    }
  };

  const app = new App();

  const stack = new PipelineStack(app, `CDKSnackCICD-${gitHubBranch}`, {
    ...props,
    gitHubBranch,
    gitHubOwner,
    gitHubRepository,
    gitHubTokenSecretId
  });

  stack.templateOptions.description = [
    "This CDK Snack uses CDK Pipelines to set up an AWS CodePipeline which", "builds and deploys this CDK Snack within AWS on your behalf"
  ].join(" ");

  stack.templateOptions.metadata = {
    cdkSnackProjectId: "54acfcb6-bd63-4384-a59d-410c828ea79b",
    cdkSnackId: "df4c903a-faed-4a51-89d0-6eb541d75314"
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
