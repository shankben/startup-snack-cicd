#!/bin/bash

set -e

mkdir -p dist

rsync -azr --delete secrets/ dist/secrets/
rsync -azr --delete src/ dist/src/

npx tsc
