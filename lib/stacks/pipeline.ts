import {
  PipelineProject,
  BuildSpec,
  LinuxBuildImage
} from "@aws-cdk/aws-codebuild";

import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId
} from "@aws-cdk/custom-resources";

import { Repository } from "@aws-cdk/aws-codecommit";

import {
  Artifact,
  Pipeline
} from "@aws-cdk/aws-codepipeline";

import {
  GitHubSourceAction,
  CodeBuildAction,
  CloudFormationCreateUpdateStackAction
} from "@aws-cdk/aws-codepipeline-actions";

import {
  Code
} from "@aws-cdk/aws-lambda";

import {
  App,
  Stack,
  StackProps,
  SecretValue
} from "@aws-cdk/core";

export interface PipelineStackProps extends StackProps {
  lambdaCode: Code;
  repoName: string
}

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: PipelineStackProps) {
    super(app, id, props);

    const code = Repository.fromRepositoryName(this, "ImportedRepo",
      props.repoName);

    const cdkBuild = new PipelineProject(this, "CdkBuild", {
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: "npm install"
          },
          build: {
            commands: [
              "npm run build",
              "npm run cdk synth -- -o dist"
            ]
          }
        },
        artifacts: {
          "base-directory": "dist",
          files: [
            "LambdaStack.template.json"
          ]
        }
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_2_0
      }
    });

    const lambdaBuild = new PipelineProject(this, "LambdaBuild", {
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: [
              "cd lambda",
              "npm install"
            ]
          },
          build: {
            commands: "npm run build"
          },
        },
        artifacts: {
          "base-directory": "lambda",
          files: [
            "index.js",
            "node_modules/**/*"
          ]
        }
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_2_0
      },
    });

    const sourceOutput = new Artifact();

    const cdkBuildOutput = new Artifact("CdkBuildOutput");

    const lambdaBuildOutput = new Artifact("LambdaBuildOutput");

    const getParameter = new AwsCustomResource(this, "GetParameter", {
      onUpdate: {
        service: "SSM",
        action: "getParameter",
        physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
        parameters: {
          Name: "/CDKSnackCICD/GitHubAccessToken",
          WithDecryption: true
        }
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });

    // Use the value in another construct with
    getParameter.getResponseField("Parameter.Value")


    new Pipeline(this, "Pipeline", {
      stages: [
        {
          stageName: "Source",
          actions: [
            new GitHubSourceAction({
              actionName: "GitHub_Source",
              oauthToken: SecretValue
                .ssmSecure("/CDKSnackCICD/GitHubAccessToken")
              repository: code,
              output: sourceOutput
            })
          ]
        },
        {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "Lambda_Build",
              project: lambdaBuild,
              input: sourceOutput,
              outputs: [lambdaBuildOutput]
            }),
            new CodeBuildAction({
              actionName: "CDK_Build",
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput]
            })
          ]
        },
        {
          stageName: "Deploy",
          actions: [
            new CloudFormationCreateUpdateStackAction({
              actionName: "Lambda_CFN_Deploy",
              templatePath: cdkBuildOutput.atPath("LambdaStack.template.json"),
              stackName: "LambdaDeploymentStack",
              adminPermissions: true,
              parameterOverrides: {
                ...props.lambdaCode.assign(lambdaBuildOutput.s3Location),
              },
              extraInputs: [lambdaBuildOutput]
            })
          ]
        }
      ]
    });
  }
}
