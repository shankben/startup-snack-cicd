import { Construct, Stack, StackProps, SecretValue } from "@aws-cdk/core";
import { Artifact } from "@aws-cdk/aws-codepipeline";
import { PolicyStatement } from "@aws-cdk/aws-iam";

import {
  CdkPipeline,
  SimpleSynthAction,
  ShellScriptAction
} from "@aws-cdk/pipelines";

import {
  GitHubSourceAction,
  ManualApprovalAction
} from "@aws-cdk/aws-codepipeline-actions";


import DevelopmentStage from "../stages/development";
import ProductionStage from "../stages/production";

export interface PipelineStackProps extends StackProps {
  developmentStageAccountId: string;
  developmentStageRegion: string;
  productionStageAccountId: string;
  productionStageRegion: string;
  gitHubBranch: string;
  gitHubOwner: string;
  gitHubRepository: string;
  gitHubTokenSecretId: string;
}

export default class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const sourceArtifact = new Artifact();
    const buildArtifact = new Artifact();

    const cdkPipeline = new CdkPipeline(this, "Pipeline", {
      cloudAssemblyArtifact: buildArtifact,
      crossAccountKeys: true,
      pipelineName: "StartupSnack-CICD-Pipeline",
      selfMutating: true,
      sourceAction: new GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        owner: props.gitHubOwner,
        repo: props.gitHubRepository,
        branch: props.gitHubBranch,
        oauthToken: SecretValue.secretsManager(props.gitHubTokenSecretId)
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact: buildArtifact,
        actionName: "Build",
        installCommand: "npm install",
        buildCommand: "npm run build"
      })
    });

    //// Development Stage
    const development = new DevelopmentStage(this, "Development", {
      managementAccount: Stack.of(this).account,
      env: {
        account: props.developmentStageAccountId,
        region: props.developmentStageRegion
      }
    });
    cdkPipeline.addApplicationStage(development);

    const { roleArn: readerRoleArn } = development.crossAccountReaderStack
      .crossAccountRole;

    const testDevelopmentStage = cdkPipeline
      .addStage(`Test-${development.stageName}`);

    testDevelopmentStage.addActions(
      new ShellScriptAction({
        actionName: "RunTests",
        runOrder: testDevelopmentStage.nextSequentialRunOrder(),
        additionalArtifacts: [sourceArtifact],
        rolePolicyStatements: [
          new PolicyStatement({
            actions: ["sts:AssumeRole"],
            resources: [readerRoleArn]
          })
        ],
        environmentVariables: {
          STACK_OUTPUT_KEY: { value: development.apiStack.apiOutputKey },
          STACK_NAME: { value: development.apiStack.stackName },
          CROSS_ACCOUNT_READER_ROLE_ARN: { value: readerRoleArn }
        },
        commands: [
          "npm install",
          "npm run test"
        ]
      }),
      new ManualApprovalAction({
        actionName: "ApproveDevelopment",
        runOrder: testDevelopmentStage.nextSequentialRunOrder()
      })
    );


    //// Production Stage
    cdkPipeline.addApplicationStage(new ProductionStage(this, "Production", {
      env: {
        account: props.productionStageAccountId,
        region: props.productionStageRegion
      }
    }));
  }
}
