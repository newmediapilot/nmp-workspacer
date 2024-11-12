#!/bin/bash

# Define the config file path
CONFIG_FILE="npm-workspacer.config"

# Check if the config file exists
if [ -f "$CONFIG_FILE" ]; then
  echo "Loading configuration from $CONFIG_FILE..."
  # Load the config file
  source "$CONFIG_FILE"
else
  echo "Configuration file $CONFIG_FILE not found."
  exit 1
fi

# Additional actions after loading the config
echo "Configuration loaded successfully."

# Prompt
