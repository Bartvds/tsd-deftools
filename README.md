# tsd-deftools

> developer tools to process TypeScript definitions and bulk edit [tsd](https://github.com/Diullei/tsd) and [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped)


## Functionality


- list tsd repo_data content
- list DefinitelyTyped definition projects and files
- compare the DefinitelyTyped and tsd repo_data contents
- parse and validate DefinitelyTyped header format
- generate tsd repo data from definition lists
- .. other data processing tasks

Basic commands are exposed as cli, rest will be exported as .js module or referable .ts

Not for general consumption unless you know what you're doing

## How

- Checkout this repos
- Open commandline in the checkout
- Edit `./tsd-deftools-path.json` to have `tsd` and `typings` pointing to the root folder of their processing checkouts. 
- __Note__: the contents of the folders configured as `out` and `tmp` can/will be automatically overwritten or removed.
- Get dependencies
````
npm install
````

- Use cli to run preset commands
````
node . //default (for now latest under-development probably (so lazy :)
node . help //view commands
node . <command> //execute command
````

- Or reference TypeScript code `./src/..` (experimental)
- Or require() the module `./build/deftools.js`  (experimental) 

- For tests and rebuild you need grunt-cli
````
npm install grunt-cli -g
````

- Rebuild
````
grunt
````

- Run tests
````
grunt test
````

## Licence
MIT