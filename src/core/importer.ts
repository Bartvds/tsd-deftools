///<reference path="_ref.ts" />
///<reference path="lib.ts" />
///<reference path="header.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/
	var definition = /^([\w _-]+)\.d\.ts$/

	export class ImportResult {
		all:HeaderData[] = [];
		error:HeaderData[] = [];
		parsed:HeaderData[] = [];
		requested:HeaderData[] = [];
		map:HeaderDataMap = {};
		ready:HeaderDataMap = {};

		constructor() {
		}

		hasDependency(list:HeaderData[] = null):HeaderData[] {
			list = list || this.all;
			return _.filter(list, (value:HeaderData) => {
				return value.dependencies.length > 0;
			})
		}

		hasReference(list:HeaderData[] = null):HeaderData[] {
			list = list || this.all;
			return _.filter(list, (value:HeaderData) => {
				return value.references.length > 0;
			})
		}

		isDependency(list:HeaderData[] = null):HeaderData[] {
			list = list || this.all;
			var ret:HeaderData[] = [];
			return _.reduce(list, (ret:HeaderData[], value:HeaderData) => {
				_(value.dependencies).forEach((dep:HeaderData) => {
					if (ret.indexOf(dep) < 0) {
						ret.push(dep);
					}
				});
				return ret;
			}, ret);
		}

		//whut
		dupeCheck(list:HeaderData[] = null):HeaderDataListMap {
			list = list || this.all;

			var ret:HeaderDataListMap = _.reduce(list, (memo:HeaderDataListMap, value:HeaderData) => {
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

		hasDependencyStat(list:HeaderData[] = null):NumberMap {
			return _.reduce(this.hasDependency(list), (memo:NumberMap, value:HeaderData) => {
				_.forEach(value.dependencies, (dep:HeaderData) => {
					var key = value.combi();
					if (memo.hasOwnProperty(key)) {
						memo[key]++;;
					} else {
						memo[key] = 1;;
					}
				});
				return memo;
			}, {});
		};

		isDependencyStat(list:HeaderData[] = null):NumberMap {
			return _.reduce(this.hasDependency(list), (memo:NumberMap, value:HeaderData) => {
				_.forEach(value.dependencies, (dep:HeaderData) => {
					var key = dep.combi();
					if (memo.hasOwnProperty(key)) {
						memo[key]++;;
					} else {
						memo[key] = 1;;
					}
				});
				return memo;
			}, {});
		}
	}

	export class DefinitionImporter {

		parser:HeaderParser;

		constructor(public repos:Repos) {
			this.parser = new HeaderParser();
		}

		loadData(data:HeaderData, res:ImportResult, callback:(err, data?:HeaderData) => void) {

			var src = path.resolve(this.repos.defs + data.def.project + '/' + data.def.name + '.d.ts');

			var key = data.def.combi();
			var self:DefinitionImporter = this;

			if (res.ready.hasOwnProperty(key)) {
				console.log('cache hit: ' + key);
				data = res.ready[key];
				return callback(null, data);
			}
			res.map[key] = data;

			fs.readFile(src, 'utf-8', (err, source) => {
				if (err) {
					data.errors.push(new ParseError('cannot load source', err));
					return callback(null, data);
				}
				data.source = src;
				self.parser.parse(data, source);

				if (!data.isValid()) {
					data.errors.push(new ParseError('invalid parse'));
				}

				if (data.references.length > 0) {

					//console.log('references: ' + data.references);

					async.forEach(data.references, (ref:string, callback:(err?, data?:HeaderData) => void) => {

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
							console.log('sub cache hit: ' + key);
							data.dependencies.push(res.map[key]);
							return callback(null, res.map[key]);
						}
						var sub = new HeaderData(dep);
						res.map[key] = sub;

						self.loadData(sub, res, (err, sub?:HeaderData) => {
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
								res.all.push(data);
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
							return callback(null, data);
						});
					}, (err) => {
						if (err) {
							console.log('err looping references ' + err);
						}
						callback(err, data);
					});
				}
				else {
					return callback(null, data);
				}
			});
		}

		parseDefinitions(projects:Def[], finish:(err?, res?:ImportResult) => void) {
			var self:DefinitionImporter = this;

			async.reduce(projects, new ImportResult(), (res:ImportResult, def:Def, callback:(err?, data?:ImportResult) => void) => {
				//
				var key = def.combi();

				if (res.map.hasOwnProperty(key)) {
					return callback(null, res);
				}
				var data = new HeaderData(def);
				res.map[key] = data;
				//res.queued[key] = data;

				self.loadData(data, res, (err?:any, data?:HeaderData) => {
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
					res.all.push(data);
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
			}, finish);
		}
	}
}