///<reference path="../_ref.ts" />
///<reference path="lib.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	var agent:SuperAgent = require('superagent');

	var stripExt = /(\.[\w_-]+)$/;
	var ignoreFile = /^[\._]/;
	var isJson = /\.json$/;

	export class DefinitionComparer {

		constructor(public repos:Repos) {

		}

		findUnpackaged(finish:(err, names:string[]) => void) {
			var self:DefinitionComparer = this;
			var ret = [];

			async.parallel({
				defs: (callback) => {
					fs.readdir(self.repos.defs, (err, files:string[]) => {
						if (err) return callback(err);

						//check if these are folders containing a definition
						async.filter(files, (file, callback:(pass) => void) => {
							if (ignoreFile.test(file)) {
								return callback(false);
							}

							var src = path.join(self.repos.defs, file);

							fs.stat(src, (err, stats) => {
								if (err) return callback(false);
								if (!stats.isDirectory()) {
									return callback(false);
								}
								fs.exists(src + '/' + file + '.d.ts', (exists) => {
									if (err) return callback(false);
									//yess!
									callback(exists);
								});
							});

						}, (files) => {
							callback(null, files);
						});
					});
				},
				tsd: (callback) => {
					fs.readdir(self.repos.tsd + 'repo_data', (err, files:string[]) => {
						if (err) return callback(err);

						callback(null, _(files).filter((value) => {
							return !ignoreFile.test(value) && isJson.test(value);
						}).map((value) => {
							return value.replace(stripExt, '');
						}));
					});
				}
			},
			(err, results) => {
				var unpacked = _(results.defs).filter((value) => {
					return results.tsd.indexOf(value) < 0;
				});
				console.log('tsd %d', results.tsd.length);
				console.log('defs %d', results.defs.length);
				console.log('unlisted %d', unpacked.length);
				finish(err, unpacked);
			});
		}
	}
}