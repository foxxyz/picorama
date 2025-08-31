![Picorama Logo](/docs/logo.png?raw=true)

Picorama: A Micro Photo Blogging Platform
=========================================

Requirements
------------

 - [Node.js 20+](https://nodejs.org/en/download/package-manager/)

Installation
------------

Clone this repo or [download the latest release](https://github.com/foxxyz/picorama/archive/refs/heads/master.zip) and unzip the package contents.

### Server Setup

1. Enter server directory: `cd server`
2. Install dependencies: `npm install`
3. Initialize database: `npm run init`
4. Run server: `npm start` and note the auth code for doing uploads

### GUI Setup

1. Enter GUI directory: `cd gui`
2. Install dependencies: `npm install`
3. Run the GUI: `npm run dev`, then check [http://localhost:5173](http://localhost:5173)

Usage
-----

Post pictures using the [Picorama Companion App](https://github.com/foxxyz/picorama-companion) (Android only) or by visiting `/upload/`.

Deployment
----------

A deploy script is included in `./deploy/deploy.sh` which can be tailored to your specific server needs, or manually deploy by following the instructions below.

### GUI

1. Compile the front-end: `npm run build`
2. Upload the contents of `gui/dist` to a directory accessible by your web server.

### Server

1. Create a link for the world to access your photos: `ln -s /path/to/picorama/server/thumbs photos`
2. Set up a run script that can be executed as a daemon. For example:

```
./server/index.js --url https://yoursite.url --auth 55555 -p 8080
```

Add this in your server directory as `run.sh`.
