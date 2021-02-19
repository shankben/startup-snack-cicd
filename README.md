# Startup Snack: CICD

![Architecture Diagram](/architecture.svg)

## Setup

  1. Install CDK globally: `npm install -g aws-cdk`
  1. Install local Node.js dependencies: `npm install`
  1. Build the project: `npm run build`
  1. Bootstrap the CDK Toolkit into your AWS account: `cdk bootstrap`
  1. Deploy the stack: `cdk deploy`

## Useful Commands

  * `npm run build` compile project to `dist`
  * `npm run clean` delete everything in `cdk.out` and `dist`
  * `npm run watch` watch for changes and compile
  * `cdk deploy` deploy this stack to your default AWS account/region
  * `cdk diff` compare deployed stack with current state
  * `cdk synth` emits the synthesized CloudFormation template

## Another Section
