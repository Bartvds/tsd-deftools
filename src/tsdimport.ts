///<reference path="_ref.ts" />
///<reference path="core/lib.ts" />
///<reference path="core/exporter.ts" />
///<reference path="core/importer.ts" />
///<reference path="core/comparer.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	var agent:SuperAgent = require('superagent');

	var pkg;
	try {
		pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
	}
	catch (e) {
		throw(e);
	}

	var paths:ConfPaths;
	var tmp = path.resolve('./tsd-deftools-path.json');
	try {
		paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'))
	}
	catch (e) {
		throw(e);
	}
	if(!fs.existsSync(paths.tmp)) {
		fs.mkdir(paths.tmp);
	}

	var info = new ToolInfo(pkg.name, pkg.version, pkg);

	var repos = new Repos(paths.DefinitlyTyped, paths.tsd, paths.tmp);
	var projects = ['underscore', 'easeljs'];

	var importer = new DefinitionImporter(repos, info);
	var exporter = new DefinitionExporter(repos, info);
	var comparer = new DefinitionComparer(repos, info);

	async.waterfall([(callback:(err) => void) => {
		console.log('findUnpackaged');
		comparer.compare(callback);

	}, (res:CompareResult, callback:(err?, list?:HeaderData[]) => void) => {
		console.log('parseDefinitions');
		//console.log(res.defs);
		importer.parseDefinitions(res.repoAll, callback);

	}, (res:ImportResult, callback:(err?) => void) => {
		console.log(res.parsed);
		console.log(res.error);

		console.log('error: ' + res.error.length);
		console.log('parsed: ' + res.parsed.length);
		console.log('exportDefinitions');

		exporter.exportDefinitions(res.parsed, callback);
		callback();
	}], (err, data) => {
		console.log('complete');
		if (err) {
			//console.log(err);
			return;
		}
		//console.log(data);
	});
}

exports = (module).exports = tsdimport;
