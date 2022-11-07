#!/usr/bin/env bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="/home"
BUILD_MODE="production"
DEPLOY_BRANCH="master"

# Set correct starting directory
cd $SCRIPT_DIR/..

# Process args
while getopts ":m:t:" flag
do
    case "${flag}" in
        m) BUILD_MODE=${OPTARG};;
        t) TARGET=${OPTARG};;
    esac
done

# Verify args are present
if [ -z ${TARGET+x} ]
then
    echo "Error: Missing deploy target and mode"
    echo "Example: ./deploy.sh -t <target_host> -m production"
    exit 1
fi

echo "> Deploying in mode ${BUILD_MODE}..."

# GUI Deploy
echo "> Compiling GUI..."
cd gui
npm run build -- --mode $BUILD_MODE
echo "> Copying GUI Artifacts..."
rsync -avh dist $TARGET:$DEPLOY_DIR/public
scp deploy/* $TARGET:$DEPLOY_DIR/public
cd ..

# Server Deploy
echo "> Copying server files..."
rsync -av --delete --exclude="node_modules" --exclude=".*" --exclude="media" --exclude "thumbs" --exclude "db.sqlite" server $TARGET:$DEPLOY_DIR/protected
echo "> Installing dependencies..."
ssh $TARGET "cd $DEPLOY_DIR/protected/server && npm install --omit=dev"

# Creating symbolic link to server thumbs
ssh $TARGET "ln -s ../protected/server/thumbs /home/public/photos"

echo "> Done!"