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

	var conf;
	var tmp = path.resolve('./tsd-deftools.json');
	try {
		conf = JSON.parse(fs.readFileSync(tmp, 'utf-8'))
	}
	catch (e) {
		console.log(e);
		throw(e);
		throw('cannot load conf: ' + tmp);
	}

	console.log(conf);
	var repos = new Repos(conf.path.DefinitlyTyped, conf.path.tsd, conf.path.out);
	var projects = ['underscore', 'easeljs'];

	var importer = new DefinitionImporter(repos);
	var exporter = new DefinitionExporter(repos);
	var comparer = new DefinitionComparer(repos);

	async.waterfall([(callback:(err) => void) => {
		console.log('findUnpackaged');
		comparer.compare(callback);

	}, (res:CompareResult, callback:(err?, list?:HeaderData[]) => void) => {
		console.log('parseDefinitions');
		//console.log(res.defs);
		importer.parseDefinitions(res.defs, callback);

	}, (res:ImportResult, callback:(err?) => void) => {
		//console.log(res.parsed);
		//console.log(res.error);

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
		console.log(data);
	});
}

exports = (module).exports = tsdimport;
