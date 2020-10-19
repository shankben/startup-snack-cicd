#!/usr/bin/env node
import "source-map-support/register";
import fs from "fs";
import path from "path";

import AWS from "aws-sdk";
import SSM from "aws-sdk/clients/ssm";
const REGION = process.env.AWS_REGION ??
  process.env.CDK_DEPLOY_REGION ??
  process.env.CDK_DEFAULT_REGION ??
  "us-east-1";

const SECRETS_PATH = path.join(__dirname, "..", "secrets");
AWS.config.update({ region: REGION });
const ssm = new SSM();

import { App } from "@aws-cdk/core";
import { LambdaStack } from "../lib/stacks/lambda";
import { PipelineStack } from "../lib/stacks/pipeline";

const ensureParameters = async () => Promise.all(fs
  .readdirSync(SECRETS_PATH)
  .filter((it) => /^[A-Za-z]/.test(it))
  .map(async (name) => {
    console.log(`Storing ${name}`);
    const parameterName = `/CDKSnackCICD/${name}`;
    const res = await ssm.describeParameters().promise();
    return res.Parameters!
      .filter((it) => it.Name === parameterName).length !== 0 ?
        Promise.resolve() :
        ssm.putParameter({
          Name: parameterName,
          Value: fs.readFileSync(path.join(SECRETS_PATH, name)).toString(),
          Type: "SecureString",
          Overwrite: true
        }).promise();
  }));

async function main() {
  await ensureParameters();

  const app = new App();

  const lambdaStack = new LambdaStack(app, "LambdaStack");

  // new PipelineStack(app, "PipelineStack", {
  //   lambdaCode: lambdaStack.lambdaCode,
  //   repoName: CODECOMMIT_REPO_NAME
  // });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
