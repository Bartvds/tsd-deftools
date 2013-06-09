///<reference path="_ref.ts" />
///<reference path="deftools/_ref.ts" />
///<reference path="xm/expose.ts" />

module deftools {

	var exp:any = {deftools: deftools, xm: xm};
	exports = (module).exports = exp;

	var isMain = (module) && require.main === (module);

	if (isMain || process.env['deftools-expose']) {

		var fs = require('fs');
		var path = require('path');
		var util = require('util');
		var async:Async = require('async');
		var _:UnderscoreStatic = require('underscore');
		//var agent:SuperAgent = require('superagent');

		var info = Config.getInfo();
		var paths = Config.getPaths();
		var api:API = new API(info, new Repos(paths.typings, paths.tsd, paths.tmp));

		//expose some easy access tools to cli
		var expose = new xm.Expose();

		expose.add('info', (args:any) => {
			console.log(info.getNameVersion());
			_(api.repos).keys().sort().forEach((value) => {
				console.log('   ' + value + ': ' + api.repos[value]);
			});
		});

		expose.add('tsdList', (args:any) => {
			api.loadTsdNames((err, res:string[]) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				console.log(util.inspect(res.sort(), false, 8));
			});
		});
		expose.add('repoList', (args:any) => {
			api.loadRepoDefs((err, res:Def[]) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				console.log(util.inspect(_.map(res, (def:Def) => {
					return def.combi();
				}).sort(), false, 8));
			});
		});

		expose.add('compareFull', (args:any) => {
			api.compare((err?, res?:deftools.CompareResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				console.log(util.inspect(res, false, 8));
				console.log(res.getStats());
			});
		});
		expose.add('compareStats', (args:any) => {
			api.compare((err?, res?:deftools.CompareResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				//console.log(util.inspect({repoUnlisted: res.repoUnlisted, tsdNotInRepo: res.tsdNotInRepo}, false, 8));
				console.log(res.getStats());
			});
		});

		expose.add('listParsed', (args:any) => {
			api.parseAll((err?, res?:deftools.ImportResult) => {
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
		expose.add('createUnlisted', (args:any) => {
			api.createUnlisted((err?, res?:deftool.ExportResult) => {
				if (err) return console.log(err);
				console.log(util.inspect(res, false, 8));
				console.log('created(): ' + res.created);
				console.log('created(): ' + res.created.length);
			});
		});*/

		expose.add('recreateAll', (args:any) => {
			api.recreateAll((err?, res?:deftools.ExportResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('recreateAll returned no result');

				console.log(util.inspect(res, false, 8));
				console.log('created(): ' + res.created.length);
			});
		});

		//export expose for testing
		exp.expose = expose;

		//run command
		if (isMain) {
			var argv = require('optimist').argv;
			//run it
			expose.executeArgv(argv, 'info');
		}
	}
}
