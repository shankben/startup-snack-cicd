import { Construct, Stack, Stage } from "@aws-cdk/core";
import { Function as LambdaFunction } from "@aws-cdk/aws-lambda";
import { ServicePrincipal } from "@aws-cdk/aws-iam";
import { HttpApi, CfnAuthorizer } from "@aws-cdk/aws-apigatewayv2";

export interface HttpApiAuthorizerProps {
  httpApi: HttpApi;
  authorizerLambda: LambdaFunction;
}

export default class HttpApiAuthorizer extends Construct {
  public readonly authorizer: CfnAuthorizer;

  public get authorizerId() {
    return this.authorizer.ref;
  }

  constructor(scope: Construct, id: string, props: HttpApiAuthorizerProps) {
    super(scope, id);

    const stage = Stage.of(this)!;
    const region = Stack.of(this).region;

    const {
      httpApi,
      authorizerLambda: fn
    } = props;

    this.authorizer = new CfnAuthorizer(this, "Authorizer", {
      apiId: httpApi.httpApiId,
      authorizerPayloadFormatVersion: "2.0",
      authorizerType: "REQUEST",
      enableSimpleResponses: true,
      identitySource: ["$request.header.Authorization"],
      name: `Authorizer-${stage.stageName}`,
      authorizerUri: [
        `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/`,
        `${fn.functionArn}/invocations`
      ].join("")
    });

    fn.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
  }
}
