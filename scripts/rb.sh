#!/bin/bash

BUCKETS=$(aws s3api list-buckets \
 --query 'Buckets[?starts_with(Name, `cdksnackpipeline`)].Name' \
 --output text)

for bucket in $BUCKETS; do
  aws s3 rb --force s3://$bucket;
done
