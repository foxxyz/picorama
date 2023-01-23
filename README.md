Picorama GUI
=================

Requirements
------------

### Node.js 18+

 * OSX: `brew install node` using [Homebrew](http://brew.sh/)
 * Linux: `apt install nodejs` ([see Ubuntu/Debian specific instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)) or `pacman -S nodejs` (Arch Linux)
 * Windows: [Install](https://nodejs.org/en/download/)

Installation
------------

1. Clone repo
2. Install dependencies: `npm install`
3. Verify it runs: `npm run dev`, then check [http://localhost:5173](http://localhost:5173)

Deployment
----------

 * Create a link for the world to access your photos: `ln -s ../protected/picorama/server/thumbs photos`
 * Set up a run script that can be executed as a daemon. For example:

```
./server/index.js --url https://yoursite.url --auth 55555 -p 8080
```

Add this in your server directory as `run.sh`.
