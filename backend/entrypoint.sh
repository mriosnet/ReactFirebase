#!/bin/sh
# filepath: backend/entrypoint.sh

# Copy initial data if /data is empty
if [ "$(ls -A /data)" = "" ] && [ -d "/backend/data" ]; then
  cp -r /backend/data/* /data/
fi

exec npm start