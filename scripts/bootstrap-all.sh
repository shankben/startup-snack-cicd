#!/bin/bash

SOURCE_ACCOUNT_ID=$1

npx cdk bootstrap \
  --profile development \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  --trust $SOURCE_ACCOUNT_ID \
  aws://505565279876/us-east-2

npx cdk bootstrap \
  --profile production \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  --trust $SOURCE_ACCOUNT_ID \
  aws://837889682371/us-east-2
