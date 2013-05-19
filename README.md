# tsd-deftools

> developer tools to process TypeScript definitions and bulk edit [tsd](https://github.com/Diullei/tsd) and [DefinitelyTyped(https://github.com/borisyankov/DefinitelyTyped)

crude, not for general consumption unless you know what you're doing

## Functionality

- compare the definitions and tsd repo_data
- list DefinitelyTyped definitions and parse standard header format
- list tsd repo_data
- generate tsd repo data from definition lists

Basic commands are beings exposed to cli (work in progress), others maybe be functional but involve editing of a script.

## How

Checkout repos

Edit `./tsd-deftools-path.json` to have `tsd` and `DefinitelyTyped` pointing to root folder of their work checkouts.

Note: the contents of the folders configured as `out` and `tmp` can/will be automatically overwritten or removed.

Open commandline in the checkout.

Get dependencies
````
npm install
````

Basic use
````
node . //default (for now latest under-development probably (so lazy :)
node . help //view commands
node . <command> //command
````

To recompile edited code
````
//have grunt-cli global
npm install grunt-cli -g
````

Rebuild
````
grunt build //build only
grunt dev //build and run default command
````
