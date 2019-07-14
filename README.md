Picorama GUI
========================

Requirements
------------

### Node.js 10+

 * OSX: `brew install node` using [Homebrew](http://brew.sh/)
 * Linux: `apt install nodejs` ([see Ubuntu/Debian specific instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)) or `pacman -S nodejs` (Arch Linux)
 * Windows: [Install](https://nodejs.org/en/download/)

Installation
------------

1. Clone repo
2. Install dependencies: `npm install`
3. Verify it runs: `npm run dev`, then check [http://localhost:8080](http://localhost:8080)

Deployment
----------

 * Create a link for the world to access your photos: `ln -s ../protected/cv/server/thumbs photos`
