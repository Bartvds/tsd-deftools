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
	var isDef = /\.d\.ts$/;

	export class Def {
		constructor(public project:string, public name:string){

		}
		combi():string {
			return this.project + '/' + this.name;
		}
	}
	export class CompareResult {
		repoAll:Def[] = [];
		repoUnlisted:Def[] = [];

		tsdAll:string[] = [];
		tsdNotInRepo:string[] = [];
	}
	export class DefinitionComparer {

		constructor(public repos:Repos) {

		}

		compare(finish:(err, res:CompareResult) => void) {
			var self:DefinitionComparer = this;

			async.parallel({
				defs: (callback) => {
					fs.readdir(self.repos.defs, (err, files:string[]) => {
						if (err) return callback(err);

						//check if these are folders containing a definition
						var ret:Def[] = [];
						async.forEach(files, (file, callback:(err) => void) => {
							if (ignoreFile.test(file)) {
								return callback(false);
							}

							var src = path.join(self.repos.defs, file);

							fs.stat(src, (err, stats) => {
								if (err) return callback(false);
								if (!stats.isDirectory()) {
									return callback(false);
								}
								fs.readdir(src, (err, files:string[]) => {
									if (err) return callback(false);

									files = _(files).filter((name) => {
										return isDef.test(name);
									});

									async.forEach(files, (name, callback:(err) => void) => {
										//src + '/' + file + '/' + sub;
										var tmp =  path.join(src, name);
										fs.stat(tmp, (err, stats) => {
											if (err) return callback(false);
											if (stats.isDirectory()) {
												return callback(false);
											}
											//console.log('-> ' + sub);
											ret.push(new Def(file, name.replace(isDef, '')));
											callback(null);
										});
									}, (err) =>{
										callback(err);
									});
								});
							});

						}, (err) => {
							callback(err, ret);
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
				res.repoAll = _(results.defs).toArray();
				res.repoUnlisted = _(results.defs).filter((value:Def) => {
					return _(results.tsd).some((t) => {
						return value.name === t;
					})
				});

				res.tsdAll = results.tsd;
				res.tsdNotInRepo = _(results.tsd).filter((value:Def) => {
					return results.defs.indexOf(value.name) < 0;
				});

				console.log('repoAll %d', res.repoAll.length);
				console.log('repoUnlisted %d', res.repoUnlisted.length);
				console.log('tsdAll %d', res.tsdAll.length);
				console.log('tsdNotInRepo %d', res.tsdNotInRepo.length);

				finish(err, res);
			});
		}
	}
}