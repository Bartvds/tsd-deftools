///<reference path="_ref.ts" />
///<reference path="deftool/_ref.ts" />
///<reference path="deftool/expose.ts" />

module deftool {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var app:AppAPI = new AppAPI(info, new Repos(paths.local, paths.tsd, paths.tmp));

	//expose some easy access tools to cli
	var expose = new Expose();
	expose.add('info', () => {
		console.log(info.getNameVersion());
		_(app.repos).keys().sort().forEach((value) => {
			console.log('   ' + value + ': ' + app.repos[value]);
		});
	});

	expose.add('compare', () => {
		app.compare((err?, res?:deftool.CompareResult) => {
			if (err) return console.log(err);
			if (!res) return console.log('compare returned no result');
			console.log(util.inspect(res, false, 8));
			console.log(res.getStats());
		});
	});

	expose.add('listParsed', () => {
		app.listParsed((err?, res?:deftool.ImportResult) => {
			if (err) return console.log(err);
			if (!res) return console.log('listParsed returned no result');
			//console.log(util.inspect(res, false, 8));
			//console.log('all:\n' + util.inspect(res.all, false, 8));
			//console.log('error: ' + util.inspect(res.error, false, 8));
			//console.log('hasDependency():\n' + util.inspect(res.hasDependency(), false, 8));
			//console.log('isDependency():\n' + util.inspect(res.isDependency(), false, 8));
			console.log('isDependencyStat():\n' + util.inspect(res.isDependencyStat(), false, 5));
			console.log('hasDependencyStat():\n' + util.inspect(res.hasDependencyStat(), false, 5));
			//console.log('dupeCheck():\n' + util.inspect(res.dupeCheck(), false, 8));
			console.log('all: ' + res.all.length);
			console.log('parsed: ' + res.parsed.length);
			console.log('error: ' + res.error.length);
			console.log('hasReference(): ' + res.hasReference().length);
			console.log('hasDependency(): ' + res.hasDependency().length);
			console.log('countReferences(): ' + res.countReferences());
			console.log('countDependencies(): ' + res.countDependencies());
			console.log('isDependency(): ' + res.isDependency().length);
			console.log('dupeCheck(): ' + _.size(res.dupeCheck()));
			console.log('checkDupes():\n' + util.inspect(res.checkDupes(), false, 4));

		});
	});
	/*
	expose.add('createUnlisted', () => {
		app.createUnlisted((err?, res?:deftool.ExportResult) => {
			if (err) return console.log(err);
			console.log(util.inspect(res, false, 8));
			console.log('created(): ' + res.created);
			console.log('created(): ' + res.created.length);
		});
	});*/

	expose.add('recreateAll', () => {
		app.recreateAll((err?, res?:deftool.ExportResult) => {
			if (err) return console.log(err);
			if (!res) return console.log('recreateAll returned no result');

			console.log(util.inspect(res, false, 8));
			console.log('created(): ' + res.created.length);
		});
	});

	//kill this when included
	var argv = require('optimist').argv;
	expose.execute('info');

	if (argv._.length == 0) {
		expose.execute('help');

		expose.execute('recreateAll');
	} else {
		expose.execute(argv._[0]);
		if (!expose.has(argv._[0])) {
			expose.execute('help');
		}
	}
}
//kill this when in cli mode
//exports = (module).exports = deftool;
