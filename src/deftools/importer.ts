///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/
	var definition = /^([\w _-]+)\.d\.ts$/

	export class ImportResult {
		all:deftools.DefData[] = [];
		error:deftools.DefData[] = [];
		parsed:deftools.DefData[] = [];
		requested:deftools.DefData[] = [];
		map:HeaderDataMap = {};
		ready:HeaderDataMap = {};

		constructor() {
		}

		hasReference(list:deftools.DefData[] = null):deftools.DefData[] {
			list = list || this.all;
			return _.filter(list, (value:deftools.DefData) => {
				return value.references.length > 0;
			})
		}

		hasDependency(list:deftools.DefData[] = null):deftools.DefData[] {
			list = list || this.all;
			return _.filter(list, (value:deftools.DefData) => {
				return value.dependencies.length > 0;
			})
		}

		countReferences(list:deftools.DefData[] = null):number {
			list = list || this.all;
			return _.reduce(list, (memo:number, value:deftools.DefData) => {
				return memo + value.references.length;
			}, 0)
		}

		countDependencies(list:deftools.DefData[] = null):number {
			list = list || this.all;
			return _.reduce(list, (memo:number, value:deftools.DefData) => {
				return memo + value.dependencies.length;
			}, 0)
		}

		isDependency(list:deftools.DefData[] = null):deftools.DefData[] {
			list = list || this.all;
			var ret:deftools.DefData[] = [];
			return _.reduce(list, (ret:deftools.DefData[], value:deftools.DefData) => {
				_(value.dependencies).forEach((dep:deftools.DefData) => {
					if (ret.indexOf(dep) < 0) {
						ret.push(dep);
					}
				});
				return ret;
			}, ret);
		}

		//whut
		dupeCheck(list:deftools.DefData[] = null):HeaderDataListMap {
			list = list || this.all;

			var ret:HeaderDataListMap = _.reduce(list, (memo:HeaderDataListMap, value:deftools.DefData) => {
				var key = value.def.name;//.combi();
				if (memo.hasOwnProperty(key)) {
					memo[key].push(value);
				} else {
					memo[key] = [value];
				}
				return memo;
			}, {});
			//filter multi reused
			return _.reduce(_.keys(ret), (memo:HeaderDataListMap, key:string) => {
				if (ret[key].length > 1) {
					memo[key] = ret[key];
				}
				return memo;
			}, {});
		}

		hasDependencyStat(list:deftools.DefData[] = null):NumberMap {
			var map = _.reduce(this.hasDependency(list), (memo:NumberMap, value:deftools.DefData) => {
				_.forEach(value.dependencies, (dep:deftools.DefData) => {
					var key = value.combi();
					if (memo.hasOwnProperty(key)) {
						memo[key]++;
					} else {
						memo[key] = 1;
					}
				});
				return memo;
			}, {});
			map._total = _.reduce(map, (memo:number, num:number) => {
				memo += num;
				return memo;
			}, 0);
			return map;
		}

		isDependencyStat(list:deftools.DefData[] = null):NumberMap {
			var map = _.reduce(this.hasDependency(list), (memo:NumberMap, value:deftools.DefData) => {
				_.forEach(value.dependencies, (dep:deftools.DefData) => {
					var key = dep.combi();
					if (memo.hasOwnProperty(key)) {
						memo[key]++;
					} else {
						memo[key] = 1;
					}
				});
				return memo;
			}, {});
			map._total = _.reduce(map, (memo:number, num:number) => {
				memo += num;
				return memo;
			}, 0);
			return map;
		}

		/*success(list:DefData[] = null):DefData[] {
			list = list || this.all;
			var ret:DefData[] = [];
			return _.reduce(list, (ret:DefData[], value:DefData) => {
				_(value.dependencies).forEach((dep:DefData) => {
					if (ret.indexOf(dep) < 0) {
						ret.push(dep);
					}
				});
				return ret;
			}, ret);
		}*/

		checkDupes():ImportResultDupes {
			return new ImportResultDupes(this);
		}
	}
	export class ImportResultDupes {
		all:HeaderDataListMap;
		error:HeaderDataListMap;
		parsed:HeaderDataListMap;
		requested:HeaderDataListMap;

		constructor(res:ImportResult) {
			this.all = res.dupeCheck(res.all);
			this.error = res.dupeCheck(res.error);
			this.parsed = res.dupeCheck(res.parsed);
			this.requested = res.dupeCheck(res.requested);
		}

		//more
	}

	//parse headers for a list of Def's from Repos
	export class DefinitionImporter {

		parser:HeaderParser;

		constructor(public repos:Repos) {
			this.parser = new HeaderParser();
		}

		parseDefinitions(defs:Def[], finish:(err?, res?:ImportResult) => void) {
			var self:DefinitionImporter = this;

			async.reduce(defs, new ImportResult(), (res:ImportResult, def:Def, callback:(err?, data?:ImportResult) => void) => {
				//
				var key = def.combi();

				if (res.map.hasOwnProperty(key)) {
					return callback(null, res);
				}
				var data = new deftools.DefData(def);
				res.map[key] = data;
				//res.queued[key] = data;

				self.loadData(data, res, (err?:any, data?:deftools.DefData) => {
					if (err) {
						console.log([<any>'err', err]);
						return callback(null, res);
					}
					if (!data) {
						console.log([<any>'null data', err]);
						//return callback('null data');
						return callback(null, res);
					}
					res.requested.push(data);
					if (res.all.indexOf(data) < 0) {
						res.all.push(data);
					}
					//TODO ditch these
					if (!data.isValid()) {
						if (res.error.indexOf(data) < 0) {
							res.error.push(data);
						}
					} else {
						if (res.parsed.indexOf(data) < 0) {
							res.parsed.push(data);
						}
					}
					return callback(null, res);
				});
			}, (err?, res?:ImportResult) => {

				finish(err, res)
			});
		}

		loadData(data:deftools.DefData, res:ImportResult, callback:(err, data?:deftools.DefData) => void) {

			var src = path.resolve(this.repos.defs + data.def.project + '/' + data.def.name + '.d.ts');

			var key = data.def.combi();
			var self:DefinitionImporter = this;

			if (res.ready.hasOwnProperty(key)) {
				//console.log('cache hit: ' + key);
				data = res.ready[key];
				return callback(null, data);
			}
			res.map[key] = data;

			fs.readFile(src, 'utf8', (err, source) => {
				if (err) {
					data.errors.push(new ParseError('cannot load source', err));
					return callback(null, data);
				}
				data.sourcePath = src;

				//actual parse
				self.parser.parse(data, source);

				if (!data.isValid()) {
					data.errors.push(new ParseError('invalid parse'));
				}

				if (data.references.length > 0) {

					//console.log('references: ' + data.references);

					async.forEach(data.references, (ref:string, callback:(err?, data?:deftools.DefData) => void) => {

						var match, dep;
						match = ref.match(dependency);
						if (match && match.length >= 3) {
							dep = new Def(match[1], match[2]);
						}
						else {
							match = ref.match(definition);
							if (match && match.length >= 2) {
								dep = new Def(data.def.project, match[1]);
							}
						}
						//console.log('dependency: ' + dep);

						if (!dep) {
							data.errors.push(new ParseError('bad reference', ref));
							return callback(null, data);
						}
						var key = dep.combi();
						if (res.map.hasOwnProperty(key)) {
							//console.log('sub cache hit: ' + key);
							data.dependencies.push(res.map[key]);
							return callback(null, res.map[key]);
						}
						var sub:deftools.DefData = new deftools.DefData(dep);
						res.map[key] = sub;

						//recursive
						self.loadData(sub, res, (err, sub?:deftools.DefData) => {
							if (err) {
								if (sub) {
									sub.errors.push(new ParseError('cannot load dependency' + sub.combi(), err));
								} else {
									data.errors.push(new ParseError('cannot load dependency', err));
								}
							}
							if (!sub) {
								data.errors.push(new ParseError('cannot load dependency', err));
							}
							else {
								data.dependencies.push(sub);
								if (res.all.indexOf(sub) < 0) {
									res.all.push(sub);
								}
								//TODO ditch these
								if (!sub.isValid()) {
									if (res.error.indexOf(sub) < 0) {
										res.error.push(sub);
									}
								}
								else if (res.parsed.indexOf(sub) < 0) {
									res.parsed.push(sub);
								}
								//console.log('save dependency: ' + match[1]);
								//console.log('save in: ' + data.name);
								//return callback(null, data);
							}
							callback(null, data);
						});
					}, (err) => {
						if (err) {
							console.log('err looping references ' + err);
						}
						if (data.references.length !== data.dependencies.length) {
							data.errors.push(new ParseError('references/dependencies mistcount ' + data.references.length + '/' + data.dependencies.length, err));
						}
						callback(err, data);
					});
				}
				else {
					return callback(null, data);
				}
			});
		}
	}
}