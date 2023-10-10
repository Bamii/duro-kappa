#!/bin/sh

# Load environment variables from .env file
[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

printenv
cd $REMOTE_TARGET
terraform init
sudo terraform apply --auto-approve \
-var "env=[\"QUEUE_CONNECTION_URL=$QUEUE_CONNECTION_URL\",\"DATABASE_URL=$DATABASE_URL\",\"EMAIL_PUBLIC_KEY=$EMAIL_PUBLIC_KEY\",\"EMAIL_PRIVATE_KEY=$EMAIL_PRIVATE_KEY\",\"NODE_ENV=production\",\"NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL\",\"STORAGE_URL=$STORAGE_URL\",\"STORAGE_KEY=$STORAGE_KEY\"]" \
-var "postgress=[\"POSTGRES_USER=$POSTGRES_USER\",\"POSTGRES_PASSWORD=$POSTGRES_PASSWORD\"]"
