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

	function getDupes(arr:string[]):string[] {
		var uni = _.unique(arr);
		arr = _.filter(arr, (value) => {
			var i = uni.indexOf(value);
			if (i > -1) {
				uni.splice(i, 1);
				return false;
			}
			return true;
		});
		return arr;
	}

	function getDefCollide(arr:Def[]):Object {
		var map:Object = _.reduce(arr, (memo:Object, def:Def) => {
			if (!memo.hasOwnProperty(def.name)) {
				memo[def.name] = [def];
			}
			else {
				memo[def.name].push(def);
			}
			return memo;
		}, {});

		var ret = {};
		_.each(map, (value:any, key) => {
			if (value.length > 1) {
				ret[key] = value;
			}
		});
		return ret;
	}

	export class Def {
		constructor(public project:string, public name:string) {

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

		repoAllDupes:Object = {};
		repoUnlistedDupes:Object = {};
		tsdAllDupes:string[] = [];
		tsdNotInRepoDupes:string[] = [];

		checkDupes():any {
			this.repoAllDupes = getDefCollide(this.repoAll);
			this.repoUnlistedDupes = getDefCollide(this.repoUnlisted);

			this.tsdAllDupes = getDupes(this.tsdAll);
			this.tsdNotInRepoDupes = getDupes(this.tsdNotInRepo);
		}

		repoAllNames():any {
			return _.map(this.repoAll, (value:Def) => {
				return value.name;
			});
		}

		repoUnlistedNames():any {
			return _.map(this.repoUnlisted, (value:Def) => {
				return value.name;
			});
		}
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
										var tmp = path.join(src, name);
										fs.stat(tmp, (err, stats) => {
											if (err) return callback(false);
											if (stats.isDirectory()) {
												return callback(false);
											}
											//console.log('-> ' + sub);
											ret.push(new Def(file, name.replace(isDef, '')));
											callback(null);
										});
									}, (err) => {
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
				res.checkDupes();

				console.log('repoAll %d', res.repoAll.length);
				console.log('repoUnlisted %d', res.repoUnlisted.length);
				console.log('tsdAll %d', res.tsdAll.length);
				console.log('tsdNotInRepo %d', res.tsdNotInRepo.length);

				console.log('dupes:');
				console.log(res.repoAllDupes);

				finish(err, res);
			});
		}
	}
}