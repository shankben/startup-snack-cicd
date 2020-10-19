import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { ServiceStack } from "../lib/stacks/service";

test("Empty Stack", () => {
  const app = new cdk.App();
  const stack = new ServiceStack(app, "MyTestStack", {
    imageTag: app.node.tryGetContext("image-tag") ?? "latest"
  });
  expectCDK(stack).to(matchTemplate({"Resources": {}}, MatchStyle.EXACT));
});
