import { Role, PolicyStatement, AccountPrincipal } from "@aws-cdk/aws-iam";

import {
  Construct,
  Stack,
  StackProps
} from "@aws-cdk/core";

export interface CrossAccountReaderProps extends StackProps {
  managementAccount: string;
}

export default class CrossAccountReaderStack extends Stack {
  public readonly crossAccountRole;

  constructor(scope: Construct, id: string, props: CrossAccountReaderProps) {
    super(scope, id, props);

    this.crossAccountRole = new Role(this, "CrossAccountAccessRole", {
      assumedBy: new AccountPrincipal(props.managementAccount),
      roleName: "ManagmentAccountCloudFormationReaderRole"
    });

    this.crossAccountRole.addToPolicy(new PolicyStatement({
      resources: ["*"],
      actions: ["cloudformation:DescribeStacks"]
    }));
  }
}
