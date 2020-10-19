import path from "path";

import {
  Construct,
  RemovalPolicy
} from "@aws-cdk/core";

import {
  AwsLogDriver,
  CfnCluster,
  CfnPrimaryTaskSet,
  CfnService,
  CfnTaskSet,
  Cluster,
  ContainerDefinition,
  ContainerImage,
  FargateTaskDefinition,
  LaunchType
} from "@aws-cdk/aws-ecs";

import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";

import {
  SecurityGroup,
  SubnetType,
  Vpc
} from "@aws-cdk/aws-ec2";

import {
  ApplicationTargetGroup
} from "@aws-cdk/aws-elasticloadbalancingv2";

import {
  LogGroup,
  RetentionDays
} from "@aws-cdk/aws-logs";


interface FargateTaskBundleProps {
  cluster: Cluster;
  imageTag: string;
  loadBalancerSecurityGroup: SecurityGroup;
  service: CfnService;
  targetGroup: ApplicationTargetGroup;
  vpc: Vpc;
}

export default class FargateTaskBundle extends Construct {
  public readonly containerName = "nginx-demo";
  public readonly container: ContainerDefinition;
  public readonly image: ContainerImage;
  public readonly primaryTaskSet: CfnPrimaryTaskSet;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly taskSet: CfnTaskSet;

  private readonly assetPath = path.join(__dirname, "..", "..", "src", "ecs");

  constructor(scope: Construct, id: string, props: FargateTaskBundleProps) {
    super(scope, id);

    this.image = ContainerImage.fromDockerImageAsset(
      new DockerImageAsset(this, "ImageAsset", {
        directory: path.join(this.assetPath, this.containerName),
        file: `Dockerfile.${props.imageTag}`
      })
    );

    this.taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      family: this.containerName,
      cpu: 512,
      memoryLimitMiB: 2048
    });

    this.container = this.taskDefinition.addContainer(this.containerName, {
      image: this.image,
      logging: new AwsLogDriver({
        streamPrefix: this.containerName,
        logGroup: new LogGroup(this, "ContainerLogGroup", {
          logGroupName: `/aws/ecs/${this.containerName}`,
          retention: RetentionDays.ONE_DAY,
          removalPolicy: RemovalPolicy.DESTROY
        })
      })
    });

    this.container.addPortMappings({
      containerPort: 80
    });

    this.taskSet = new CfnTaskSet(this, "TaskSetBlue", {
      cluster: (props.cluster.node.defaultChild as CfnCluster).ref,
      service: props.service.ref,
      launchType: LaunchType.FARGATE,
      taskDefinition: this.taskDefinition.taskDefinitionArn,
      scale: {
        unit: "PERCENT",
        value: 100
      },
      networkConfiguration: {
        awsVpcConfiguration: {
          securityGroups: [props.loadBalancerSecurityGroup.securityGroupId],
          subnets: props.vpc.selectSubnets({
            subnetType: SubnetType.PRIVATE
          }).subnetIds
        }
      },
      loadBalancers: [{
        containerName: this.container.containerName,
        containerPort: this.container.containerPort,
        targetGroupArn: props.targetGroup.targetGroupArn
      }]
    });

    this.primaryTaskSet = new CfnPrimaryTaskSet(this, "PrimaryTaskSet", {
      cluster: (props.cluster.node.defaultChild as CfnCluster).ref,
      service: props.service.ref,
      taskSetId: this.taskSet.attrId
    });
  }
}
