import path from "path";

import {
  App,
  Stack,
  StackProps
} from "@aws-cdk/core";

import {
  LambdaDeploymentConfig,
  LambdaDeploymentGroup
} from "@aws-cdk/aws-codedeploy";

import {
  Alias,
  CfnParametersCode,
  Code,
  Function as LambdaFunction,
  Runtime
} from "@aws-cdk/aws-lambda";

export class LambdaStack extends Stack {
  public readonly lambdaCode: Code;

  private readonly assetPath = path.join(__dirname, "..", "..", "src",
    "lambda");

  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    this.lambdaCode = Code.fromAsset(path.join(this.assetPath, "hello"));

    const fn = new LambdaFunction(this, "Lambda", {
      code: this.lambdaCode,
      handler: "index.main",
      runtime: Runtime.NODEJS_12_X
    });

    const alias = new Alias(this, "LambdaAlias", {
      aliasName: "production",
      version: fn.currentVersion
    });

    new LambdaDeploymentGroup(this, "DeploymentGroup", {
      alias,
      deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE
    });
  }
}
