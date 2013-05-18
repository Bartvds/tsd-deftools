# tsd-def-tools

> developer tools to process TypeScript definitions and bulk edit tsd

crude, not for general consumption unless you know what you're doing

## Functionality

for now involves editing of the script, but the basic blocks are seperated for re-arrangement / configuration

- list DefinitelyTyped definitions and parse standard header format
- list tsd repos_data
- compare the definitions and tsd repo data
- generate tsd repo data from definition lists

## Install

````
npm install //pull dependencies
grunt build //compile
grunt execute
````