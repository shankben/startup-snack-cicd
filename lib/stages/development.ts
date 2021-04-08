import {
  Stage,
  Construct,
  StageProps,
} from "@aws-cdk/core";

import CrossAccountReader from "../stacks/cross-account-reader";
import DataStack from "../stacks/data";
import RestApiStack from "../stacks/api";

export interface DevelopmentStageProps extends StageProps {
  managementAccount: string;
  stageName?: string;
}

export default class DevelopmentStage extends Stage {
  public readonly stageName: string;
  public readonly crossAccountReaderStack: CrossAccountReader;
  public readonly apiStack: RestApiStack;

  constructor(scope: Construct, id: string, props: DevelopmentStageProps) {
    super(scope, id, props);

    this.stageName = props?.stageName ?? "development";

    this.crossAccountReaderStack = new CrossAccountReader(
      this,
      "CrossAccountReaderStack",
      { managementAccount: props.managementAccount }
    );

    const dataStack = new DataStack(this, "DataStack");

    this.apiStack = new RestApiStack(this, "ApiStack", { dataStack });
  }
}
