///<reference path="_ref.ts" />
///<reference path="core/lib.ts" />


module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	var agent:SuperAgent = require('superagent');

	var repos = new Repos('https://github.com/borisyankov/DefinitelyTyped', '../../DefinitelyTyped/fork');

	var parser = new HeaderParser();

	var projects = ['mocha'];

	async.forEachLimit(projects, 3, (name, callback:(err?) => void) => {

		var path = repos.local + '/' + name + '/' + name + '.d.ts';

		async.waterfall([(callback:(err?) => void) => {
			console.log('name: ' + name);
			console.log('path: ' + path);
			fs.readFile(path, 'utf8', callback)
		}, (data, callback:(err?) => void) => {

			console.log(data+'');
			callback();

		},(callback:(err?) => void) => {
			callback();
		}],
		(err) => {
			callback(err);
			console.log('completed' + name);
		});
	}, (err) => {
		if (err) throw err;
		console.log('all done!');
	});
}
