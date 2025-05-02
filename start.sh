#!/bin/sh

# Change to the directory where the script is located
cd "$(dirname "$0")"

npm run build 2>&1 > /dev/null && npm start
