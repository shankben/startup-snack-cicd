import { Role, PolicyStatement } from "@aws-cdk/aws-iam";

import {
  Construct,
  RemovalPolicy,
  Stack,
  StackProps,
  Stage
} from "@aws-cdk/core";

import {
  AttributeType,
  BillingMode,
  Table as DynamoTable
} from "@aws-cdk/aws-dynamodb";


export default class DataStack extends Stack {
  public readonly widgetsTable: DynamoTable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = Stage.of(this)!;

    this.widgetsTable = new DynamoTable(this, id, {
      tableName: `StartupSnack-CICD-Widgets-${stage.stageName}`,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING
      }
    });
  }
}
