import { Construct, Stack, StackProps, SecretValue } from "@aws-cdk/core";
import { Artifact } from "@aws-cdk/aws-codepipeline";
import { GitHubSourceAction } from "@aws-cdk/aws-codepipeline-actions";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";

import MainStage from "../stages/main";

export interface PipelineStackProps extends StackProps {
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
      pipelineName: `CDKSnackCICD-${props.gitHubBranch}`,
      crossAccountKeys: false,
      selfMutating: true,
      cloudAssemblyArtifact: buildArtifact,
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

    cdkPipeline.addApplicationStage(new MainStage(
      this,
      `AppStage-${props.gitHubBranch}`,
      { stageName: props.gitHubBranch }
    ));
  }
}
