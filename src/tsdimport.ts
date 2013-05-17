///<reference path="_ref.ts" />
///<reference path="core/lib.ts" />
///<reference path="core/exporter.ts" />
///<reference path="core/importer.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	var agent:SuperAgent = require('superagent');

	var repos = new Repos('https://github.com/borisyankov/DefinitelyTyped', '../../DefinitelyTyped/fork', 'out');
	//var repos = new Repos('https://github.com/borisyankov/DefinitelyTyped', './typings/DefinitelyTyped');
	var projects = ['underscore', 'easeljs'];

	var importer = new DefinitionImporter(repos);
	var exporter = new DefinitionExporter(repos);

	importer.parseDefinitions(projects, (err?, map?:HeaderData[]) => {
		console.log('parseDefinitions complete');
		if (err) {
			console.log(err);
			return;
		}
		console.log(util.inspect(map, false, 10));

		exporter.exportDefinitions(map, (err?) => {
			console.log('exportDefinitions complete');
			if (err) {
				console.log(err);
				return;
			}

		});
	});
}

exports = (module).exports = tsdimport;
