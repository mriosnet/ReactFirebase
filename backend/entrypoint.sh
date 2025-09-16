#!/bin/sh
# filepath: backend/entrypoint.sh

# Copy initial data if /data is empty
if [ "$(ls -A /backend/data)" = "" ] && [ -d "/backend/data" ]; then
  cp -r /backend/data/* /backend/data/
fi
chmod -R 777 /backend/data
exec npm start