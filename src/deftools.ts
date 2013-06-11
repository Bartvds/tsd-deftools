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

		var write = (ref, obj) => {
			if (ref) {
				ref = path.resolve(process.cwd(), ref);
				fs.writeFileSync(ref, JSON.stringify(obj, null, 2));
				console.log('result written as json to: ' + ref);
			}
		}

		var params = {
			write: 'write to file as json: "--write <path>"',
			dump: 'dump to console: "--dump"'
		};

		//expose some easy access tools to cli
		var expose = new xm.Expose();

		expose.add('info', (args:any) => {
			console.log(info.getNameVersion());
			_(api.repos).keys().sort().forEach((value) => {
				console.log('   ' + value + ': ' + api.repos[value]);
			});
		}, 'print tool info');

		expose.add('repoList', (args:any) => {
			api.loadRepoDefs((err, res:Def[]) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				write(args.write, res);
				if (args.dump) {
					console.log(util.inspect(_.map(res,(def:Def) => {
						return def.combi();
					}).sort(), false, 8));
				}
				console.log('repo items: ' + res.length);
			});
		}, 'list repo content', params);

		expose.add('tsdList', (args:any) => {
			api.loadTsdNames((err, res:string[]) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				write(args.write, res);
				if (args.dump) {
					console.log(util.inspect(res.sort(), false, 10));
				}
				console.log('tsd items: ' + res.length);

			});
		}, 'list TSD content', params);

		expose.add('compare', (args:any) => {
			api.compare((err?, res?:deftools.CompareResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('compare returned no result');

				write(args.write, res);
				if (args.dump) {
					console.log(util.inspect(res, false, 10));
				}
				console.log(res.getStats());
			});
		}, 'compare repo and TSD content, print info', params);

		expose.add('repoParse', (args:any) => {
			//reuse
			var reportParseStat = (err?, res?:deftools.ImportResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('parseProject returned no result');

				write(args.write, res);
				if (args.dump) {
					console.log('error:\n' + util.inspect(res.error, false, 5));
					console.log('parsed:\n' + util.inspect(res.parsed, false, 5));
				}

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
			};
			//do it!
			if (args.project) {
				api.parseProject(args.project, reportParseStat);
			}
			else {
				api.parseAll(reportParseStat);
			}
		}, 'parse repo typing headers', _.defaults({
			project: 'project name: "--project angular"'
		}, params));

		expose.add('updateTsd', (args:any) => {

			var options = {
				parse: args.parse,
				export: args.export
			};

			api.updateTsd(options, (err?, res?:deftools.RecreateResult) => {
				if (err) return console.log(err);
				if (!res) return console.log('updateTSD returned no result');

				write(args.write, res);
				if (args.dump) {
					console.log(util.inspect(res, false, 10));
				}

				console.log('parse');
				console.log('   select: ' + res.importSelection.length);
				console.log('   success: ' + res.importResult.parsed.length);
				console.log('   error: ' + res.importResult.error.length);
				console.log('export');
				console.log('   select: ' + res.exportSelection.length);
				console.log('   created: ' + res.exportResult.created.length);
			});
		}, 'recreate TDS data from parsed repo content', _.defaults({
			parse: 'parse selector: "--parse [all | new]"',
			export: 'export selector: "--export [parsed | all | error | all]"'
		}, params));

		//export expose for testing
		exp.expose = expose;

		//run command
		if (isMain) {
			expose.execute('info');
			var argv = require('optimist').argv;
			//run it
			expose.executeArgv(argv, 'info');
		}
	}
}
