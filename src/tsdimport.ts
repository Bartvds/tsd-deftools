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
		comparer.findUnpackaged(callback);

	}, (unpacked:string[], callback:(err?, list?:HeaderData[]) => void) => {
		console.log(unpacked);
		console.log('parseDefinitions');
		importer.parseDefinitions(unpacked, callback);

	}, (list:HeaderData[], callback:(err?) => void) => {
		console.log(list);
		console.log('exportDefinitions');
		//exporter.exportDefinitions(list, callback);
		callback();
	}], (err, data) => {
		console.log('complete');
		console.log(data);
		if (err) {
			console.log(err);
			return;
		}
	});
}

exports = (module).exports = tsdimport;
