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

	var projects = ['mocha', 'easeljs'];

	async.forEachLimit(projects, 3, (name, callback:(err?) => void) => {

		var path = repos.local + '/' + name + '/' + name + '.d.ts';

		async.waterfall([(callback) => {
			console.log('name: ' + name);
			console.log('path: ' + path);
			fs.readFile(path, 'utf-8', callback)
		}, (source, callback) => {

			var parser = new HeaderParser();
			var data = parser.parse(source)

			console.log(util.inspect(data, false, 6));

			if (!data) {
				return callback('bad data ' + name);
			}
			if (data.errors.length > 0) {
				return callback(data.errors);
			}
			if (!data.isValid()) {
				return callback('invalid data');
			}

			var encoder = new Encode_V2();
			var v2 = encoder.encode(data);

			console.log(util.inspect(v2, false, 6));

			callback(null, data);

		}],
		(err) => {
			if (err) {
				return callback(err);
			}
			console.log('completed ' + name);
		});
	}, (err) => {
		if (err) {
			console.log(err);
			//throw err;
		}
		console.log('all done!');
	});
}
