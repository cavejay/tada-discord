#!/bin/sh

# Possible restore file
restorefile=/app/data.dump

# Wait for RethinkDB to start
while ! nc -z $TADA_API_DATABASEADDR $TADA_API_DATABASEPORT; do
    sleep 1
done

# Run test
python3 dbtest.py $TADA_API_DATABASEADDR $TADA_API_DATABASEPORT
output=$?

# Check whether the database is empty or not
if [ $output -eq 0 ];
then
    echo "Database already populated - no need to restore"
else
    echo "Database is not already populated - Checking for file to restore from: /app/data.dump"
    if [ -f "$restorefile" ]; then 
      echo "Attempting database restore with file found at /app/data.dump"
      rethinkdb restore --connect $TADA_API_DATABASEADDR:$TADA_API_DATABASEPORT --import TadaDB_v1 /app/data.dump
      if [$? -gt 0]; then
        echo "Restore failed!"
        exit
      fi
      echo "Restore was successful"
    else
      echo "No file provided to restore from. No restoration action started."
    fi
fi

# run cron in foreground mode
cron -n