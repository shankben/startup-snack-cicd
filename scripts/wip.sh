#!/bin/bash

CWD=$(pwd -P)
cat /dev/urandom | base64 | head -c 5 > $CWD/entropy && \
git commit -am "wip" && git push
