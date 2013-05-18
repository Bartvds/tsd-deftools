# tsd-deftools

> developer tools to process TypeScript definitions and bulk edit tsd

crude, not for general consumption unless you know what you're doing

## Functionality

- compare the definitions and tsd repo_data
- list DefinitelyTyped definitions and parse standard header format
- list tsd repo_data
- generate tsd repo data from definition lists

Basic commands are beings exposed to cli (work in progress), so others are funcitonal but involve editing of a script.

## How

Checkout repos

Edit `./tsd-deftools-path.json` to have `tsd` and `DefinitelyTyped` pointing to root folder of their work checkouts.

Open commandline in the checkout.

Get dependencies
````
npm install
````

Basic use
````
node . //cli help menu
node . <command> //command
````

To recompile edited code
````
grunt build
````
