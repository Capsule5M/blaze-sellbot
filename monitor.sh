#!/bin/bash

SCREEN_NAME="BlazeProdAPI"
NODE_APP_PATH="/home/blaze-sellbot"

while true; do
  # Check if the screen session exists
  screen -ls | grep -q "$SCREEN_NAME"
  SCREEN_EXISTS=$?

  # If the screen session doesn't exist, start the Node.js app in a new screen
  if [ $SCREEN_EXISTS -ne 0 ]; then
    echo "Screen session not found, starting the Node.js app..."
    screen -S "$SCREEN_NAME" -dm bash -c "node $NODE_APP_PATH"
  fi

  # Check the screen session every 10 seconds
  sleep 5
done
