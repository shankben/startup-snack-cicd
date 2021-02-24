import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

import {
  CloudFormationClient,
  DescribeStacksCommand,
  Output
} from "@aws-sdk/client-cloudformation";

const region = process.env.AWS_REGION ??
  process.env.CDK_DEPLOY_REGION ??
  process.env.CDK_DEFAULT_REGION ??
  "us-east-1";

const sts = new STSClient({ region });
const cfn = new CloudFormationClient({ region });

export const getCrossStackOutput = async (key: string): Promise<string> => {
  const { Credentials: creds } = await sts.send(new AssumeRoleCommand({
    RoleArn: process.env.CROSS_ACCOUNT_READER_ROLE_ARN,
    RoleSessionName: "Jest"
  }));

  process.env.AWS_ACCESS_KEY_ID = creds!.AccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = creds!.SecretAccessKey;
  process.env.AWS_SESSION_TOKEN = creds!.SessionToken;

  const { Stacks: stacks } = await cfn.send(new DescribeStacksCommand({
    StackName: process.env.STACK_NAME
  }));

  return stacks!.shift()!.Outputs!
    .find((it: Output) => it.OutputKey === key)!
    .OutputValue!;
};
