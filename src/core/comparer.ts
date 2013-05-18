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

	export class CompareResult {
		unlisted:string[] = [];
		notDefs:string[] = [];
		tsd:string[] = [];
		defs:string[] = [];
	}
	export class DefinitionComparer {

		constructor(public repos:Repos) {

		}

		compare(finish:(err, res:CompareResult) => void) {
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
				var res = new CompareResult();
				res.unlisted = _(results.defs).filter((value) => {
					return results.tsd.indexOf(value) < 0;
				});
				res.notDefs = _(results.tsd).filter((value) => {
					return results.defs.indexOf(value) < 0;
				});
				res.tsd = _(results.tsd).toArray();
				res.defs = _(results.defs).toArray();

				console.log('tsd %d', res.tsd.length);
				console.log('defs %d', res.defs.length);
				console.log('notDefs %d', res.notDefs.length);
				console.log('unlisted %d', res.unlisted.length);

				finish(err, res);
			});
		}
	}
}