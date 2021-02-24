import "source-map-support/register";
import fs from "fs";
import path from "path";
import { App } from "@aws-cdk/core";
import PipelineStack from "../lib/stacks/pipeline";

const pjp = path.join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(pjp).toString());
const {
  developmentStageAccountId,
  developmentStageRegion,
  productionStageAccountId,
  productionStageRegion,
  gitHubBranch,
  gitHubOwner,
  gitHubRepository,
  gitHubTokenSecretId
} = packageJson.config;

async function main() {
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

  const stack = new PipelineStack(app, "StartupSnack-CICD", {
    ...props,
    developmentStageAccountId,
    developmentStageRegion,
    productionStageAccountId,
    productionStageRegion,
    gitHubBranch,
    gitHubOwner,
    gitHubRepository,
    gitHubTokenSecretId
  });

  stack.templateOptions.description = [
    "This Startup Snack uses CDK Pipelines to set up an AWS CodePipeline which",
    "builds and deploys this Startup Snack within AWS on your behalf"
  ].join(" ");

  stack.templateOptions.metadata = {
    StartupSnackProjectId: "54acfcb6-bd63-4384-a59d-410c828ea79b",
    StartupSnackId: "df4c903a-faed-4a51-89d0-6eb541d75314"
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
