# tsd-def-tools

> developer tools to process TypeScript definitions and bulk edit tsd

crude, not for general consumption unless you know what you're doing

## Functionality

for now involves editing of the script, but the basic blocks are seperated for re-arrangement / configuration

- list DefinitelyTyped definitions and parse standard header format
- list tsd repo_data
- compare the definitions and tsd repo_data
- generate tsd repo data from definition lists

## How

Checkout repos

Edit `./tsd-deftools-path.json` to have `tsd` and `DefinitelyTyped` pointing to root folder of their work checkouts.

Open commandline in the checkout.

Basic use
````
node . //cli help menu
node . <command> //command
````

To get development code
````
npm install
````

To recompile edited features
````
grunt build
````
