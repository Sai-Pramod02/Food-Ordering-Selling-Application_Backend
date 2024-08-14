#!/bin/bash

LOG_FILE="keep_alive.log"
PID_FILE="keep_alive.pid"

# Check if the script is already running
if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE); then
    echo "Script is already running." >> $LOG_FILE
    exit 1
fi

# Save the PID of the current script
echo $$ > $PID_FILE

# Function to ping the database
ping_database() {
    while true; do
        # Log current timestamp
        echo "$(date): Pinging database..." >> $LOG_FILE

        # Command to ping your MySQL database (update with your actual credentials)
        if mysql -h 34.127.63.114 -u root -p'letzgoo' -e "USE food_buddies; SELECT * FROM COMMUNITIES;" &> /dev/null; then
            echo "$(date): Database is alive." >> $LOG_FILE
        else
            echo "$(date): Database is down!" >> $LOG_FILE
        fi

        # Wait for 5 minutes before the next ping
        sleep 60
    done
}

# Run the ping function
ping_database

# Remove the PID file when the script exits
trap "rm -f $PID_FILE" EXIT

