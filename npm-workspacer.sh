#!/bin/bash

# Define the config file path
CONFIG_FILE="npm-workspacer.json"

# Check if the config file exists
if [ -f "$CONFIG_FILE" ]; then
  echo "Loading configuration from $CONFIG_FILE..."
  source "$CONFIG_FILE"
else
  echo "Configuration file $CONFIG_FILE not found."
  exit 1
fi

# Ask for a GitHub username
read -p "Enter GitHub username to fetch repository list: " github_username

# Fetch the repository list from GitHub API
response=$(curl -s "https://api.github.com/users/$github_username/repos" | jq -r '.[].name')

# Check if response is empty
if [ -z "$response" ]; then
  echo "No repositories found for user '$github_username' or user does not exist."
else
  echo "Repositories for user '$github_username':"
  echo "$response"
fi

# Prompt the user for self-deletion
read -p "Do you want this script to delete itself? (y/n): " confirm
if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  echo "Deleting script..."
  rm -- "$0"
  echo "Script deleted."
else
  echo "Script retained."
fi
