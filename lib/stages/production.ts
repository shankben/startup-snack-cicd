import {
  Stage,
  Construct,
  StageProps,
} from "@aws-cdk/core";

import DataStack from "../stacks/data";
import RestApiStack from "../stacks/api";

export interface ProductionStageProps extends StageProps {
  stageName?: string;
}

export default class ProductionStage extends Stage {
  public readonly stageName: string;

  constructor(scope: Construct, id: string, props: ProductionStageProps) {
    super(scope, id, props);

    this.stageName = props?.stageName ?? "production";

    const dataStack = new DataStack(this, "DataStack");

    const apiStack = new RestApiStack(this, "ApiStack", {
      dataStack
    });
  }
}
