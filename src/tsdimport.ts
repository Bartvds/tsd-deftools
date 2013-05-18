///<reference path="_ref.ts" />
///<reference path="core/api.ts" />
///<reference path="core/lib.ts" />
///<reference path="core/expose.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var app = new AppAPI(info, new Repos(paths.DefinitlyTyped, paths.tsd, paths.tmp));

	console.log('-> compare');

	var expose = new Expose();
	expose.add('compare', () => {
		app.compare((err?, res?:CompareResult) => {
			if (err) return console.log(err);
			console.log(res);
		});
	})
	expose.add('createUnlisted', () => {
		app.createUnlisted((err?, res?:ExportResult) => {
			if (err) return console.log(err);
			console.log(res);
		});
	})

	expose.add('parseCurrent', () => {
		app.parseCurrent((err?, res?:CompareResult) => {
			if (err) return console.log(err);
			console.log(res);
		});
	});


	expose.execute('compare');
}

exports = (module).exports = tsdimport;
