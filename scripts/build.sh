#!/bin/bash

set -e

mkdir -p dist/secrets
mkdir -p dist/assets

rsync -azr --delete assets/ dist/assets/
rsync -azr --delete secrets/ dist/secrets/

npx tsc
