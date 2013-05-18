///<reference path="_ref.ts" />
///<reference path="core/api.ts" />
///<reference path="core/lib.ts" />
///<reference path="core/config.ts" />
///<reference path="core/expose.ts" />
///<reference path="core/importer.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var app:AppAPI = new AppAPI(info, new Repos(paths.DefinitelyTyped, paths.tsd, paths.tmp));

	//expose some easy access tools to cli
	var expose = new Expose();
	expose.add('info', () => {
		console.log(info.getNameVersion());
		_(app.repos).keys().sort().forEach((value) => {
			console.log('   ' + value + ': ' + app.repos[value]);
		});
	});

	expose.add('compare', () => {
		app.compare((err?, res?:CompareResult) => {
			if (err) return console.log(err);
			console.log(util.inspect(res, false, 8));
			console.log(res.getStats());
		});
	});

	expose.add('testParser', () => {
		app.testParser((err?, res?:ImportResult) => {
			if (err) return console.log(err);
			//console.log(util.inspect(res, false, 8));
			console.log(util.inspect(res.error, false, 8));
		});
	});

	expose.add('createUnlisted', () => {
		app.createUnlisted((err?, res?:ExportResult) => {
			if (err) return console.log(err);
			console.log(util.inspect(res, false, 8));
		});
	});
/*
	expose.add('parseCurrent', () => {
		app.parseCurrent((err?, res?:CompareResult) => {
			if (err) return console.log(err);
			console.log(util.inspect(res, false, 8));
		});
	});*/

	//kill this when included
	var argv = require('optimist').argv;
	expose.execute('info');

	if (argv._.length == 0) {
		expose.execute('help');
		expose.execute('testParser');
	} else {
		expose.execute(argv._[0]);
		if (!expose.has(argv._[0])) {
			expose.execute('help');
		}
	}
}
//kill this when in cli mode
//exports = (module).exports = tsdimport;
