///<reference path="_ref.ts" />
///<reference path="deftools/_ref.ts" />
///<reference path="xm/expose.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var repos = new Repos(paths.typings, paths.tsd, paths.tmp);
	var api:API = new API(info, repos);

	console.log('devdev');
	console.log(util.inspect(paths));

	var loader = new ListLoader(repos);
	loader.loadRepoProjectDefs('angularjs', (err, defs:Def[]) => {
		if (err) return console.log(err);
		if (!defs) return console.log('parseDefinitions no res');
		console.log(defs);

		var importer = new DefinitionImporter(repos);
		importer.parseDefinitions(defs, (err?, res?:ImportResult) => {
			if (err) return console.log(err);
			if (!res) return console.log('parseDefinitions no res');
			console.log(util.inspect(res, false, 10));

		});
	});
}
