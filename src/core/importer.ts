///<reference path="../_ref.ts" />
///<reference path="lib.ts" />
///<reference path="parser.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/
	var definition = /^([\w _-]+)\.d\.ts$/

	export class ImportResult {
		error:HeaderData[] = [];
		parsed:HeaderData[] = [];
		map:Object = {};

		constructor() {
		}
	}

	export class DefinitionImporter {

		parser:HeaderParser;

		constructor(public repos:Repos) {
			this.parser = new HeaderParser();
		}

		loadData(data:HeaderData, callback:(err, data?:HeaderData) => void) {

			var src = path.resolve(this.repos.defs + data.def.project + '/' + data.def.name + '.d.ts');

			var key = data.def.combi();
			var self:DefinitionImporter = this;

			fs.readFile(src, 'utf-8', (err, source) => {
				if (err) {
					data.errors.push(new ParseError('cannot load source', err));
					return callback(null, data);
				}
				self.parser.parse(data, source)
				data.source = src;

				if (data.errors.length > 0) {
					return callback(null, data);
				}
				if (!data.isValid()) {
					data.errors.push(new ParseError('invalid fields'));
					return callback(null, data);
				}
				return callback(null, data);
			});
		}

		parseDefinitions(projects:Def[], finish:(err?, res?:ImportResult) => void) {
			var res = new ImportResult();
			var self:DefinitionImporter = this;

			async.forEach(projects, (def:Def, callback:(err?, data?) => void) => {

				//
				var key = def.combi();
				var data = new HeaderData(def);
				res.map[key] = data;

				self.loadData(data, (err?:any, data?:HeaderData) => {
					if (err) {
						console.log([<any>'err', err]);
						return callback(err);
					}
					if (!data) {
						return callback('null data');
					}

					if (!data.isValid()) {
						res.error.push(data);
						return callback(null, data);
					}
					//ok!
					res.parsed.push(data);

					if (data.references.length > 100000000) {

						//console.log('references: ' + data.references);

						async.forEach(data.references, (ref, callback:(err?, data?) => void) => {

							var match, dep;
							match = ref.match(dependency);
							if (match && match.length >= 3) {
								dep = new Def(match[1], match[2]);
							}
							else {
								match = ref.match(definition);
								if (match && match.length >= 2) {
									dep = new Def(def.project, match[1]);
								}
							}

							if (dep) {

								var sub = new HeaderData(dep);
								var key = dep.combi();
								if (res.map.hasOwnProperty(key)) {
									//console.log('dependency from cache: ' + key);
									return callback(null, res.map[key]);
								}

								self.loadData(sub, (err, sub?:HeaderData) => {
									if (err) {
										if (sub) {
											sub.errors.push(new ParseError('cannot load dependency', err));
										}
										//res.error.push(sub);
										return callback(err);
									}
									if (!sub) {
										return callback('cannot load dependency');
									}
									res.map[key] = sub;
									//console.log('save dependency: ' + match[1]);
									//console.log('save in: ' + data.name);
									data.dependencies.push(sub);
									return callback(null, data);
								});
								return;
							}
							return callback(['bad reference', def.project, def.name, ref]);

						}, (err) => {
							//console.log('looped references');
							callback(err);
						});
					} else {
						callback(null, data);
					}
				});
			}, (err) => {
				if (err) {
					//console.log('err ' + err);
					return finish(err);
				}
				finish(null, res);
			});
		}
	}
}