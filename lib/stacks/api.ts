import path from "path";

import { Construct, Duration, Stage, StackProps, Stack } from "@aws-cdk/core";
import { Code, Function as LambdaFunction, Runtime } from "@aws-cdk/aws-lambda";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";

import {
  AddRoutesOptions,
  CfnRoute,
  HttpApi,
  HttpMethod,
  HttpStage
} from "@aws-cdk/aws-apigatewayv2";

import HttpApiAuthorizer from "../constructs/http-api-authorizer";

import type DataStack from "./data";

export interface RestApiStackProps extends StackProps {
  dataStack: DataStack;
}

export default class RestApiStack extends Stack {
  public readonly api;
  public readonly authorizer;

  private readonly assetPath = path.join(__dirname, "..", "..", "src",
    "lambda");

  private integrationLambda(name: string, ...assetPath: string[]) {
    const stage = Stage.of(this)!;
    const id = `${name}-${stage.stageName}`;
    return new LambdaFunction(this, id, {
      code: Code.fromAsset(path.join(this.assetPath, ...assetPath)),
      functionName: id,
      runtime: Runtime.NODEJS_12_X,
      handler: "index.handler",
      environment: { STAGE: stage.stageName }
    });
  }

  private widgetIntegration(
    props: RestApiStackProps,
    name: string,
    verb: string
  ) {
    const fn = this.integrationLambda(name, "widgets", verb);
    props.dataStack.widgetsTable.grantReadWriteData(fn);
    return new LambdaProxyIntegration({ handler: fn });
  }

  private addAuthorizedRoute(opts: AddRoutesOptions) {
    const routes = this.api.addRoutes(opts);
    routes.forEach((it) => {
      const { authorizerId } = this.authorizer;
      const cfnRoute = it.node.defaultChild as CfnRoute;
      cfnRoute.addPropertyOverride("AuthorizationType", "CUSTOM");
      cfnRoute.addPropertyOverride("AuthorizerId", authorizerId);
    });
  }

  constructor(scope: Construct, id: string, props: RestApiStackProps) {
    super(scope, id, props);

    const stage = Stage.of(this)!;

    this.api = new HttpApi(this, "Api", {
      apiName: "CDKSnackCICD-Widgets",
      createDefaultStage: false,
      corsPreflight: {
        maxAge: Duration.days(1),
        allowOrigins: ["*"],
        allowHeaders: ["Authorization"],
        allowMethods: [
          HttpMethod.GET,
          HttpMethod.HEAD,
          HttpMethod.OPTIONS,
          HttpMethod.POST
        ]
      }
    });

    this.authorizer = new HttpApiAuthorizer(this, "Authorizer", {
      httpApi: this.api,
      authorizerLambda: new LambdaFunction(this, "authorizerLambda", {
        functionName: `Authorizer-${stage.stageName}`,
        code: Code.fromAsset(path.join(this.assetPath, "authorizer")),
        runtime: Runtime.NODEJS_12_X,
        handler: "index.handler",
        environment: { STAGE: stage.stageName }
      })
    });

    this.addAuthorizedRoute({
      path: "/widgets",
      methods: [HttpMethod.GET],
      integration: this.widgetIntegration(props, "ListWidgets", "list")
    });

    new HttpStage(this, "Stage", {
      httpApi: this.api,
      stageName: Stage.of(this)!.stageName,
      autoDeploy: true
    });
  }
}
