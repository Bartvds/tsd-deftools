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
		error:any[] = [];
		parsed:HeaderData[] = [];
		map:Object = {};

		constructor() {
		}
	}

	export class DefinitionImporter {


		constructor(public repos:Repos) {

		}

		loadDef(def:Def, res:ImportResult, callback:(err, data?) => void) {
			var src = path.resolve(this.repos.defs + def.project + '/' + def.name + '.d.ts');
			var self:DefinitionImporter = this;

			var key = def.combi();

			if (res.map.hasOwnProperty(key)) {
				console.log('from cache: ' + key);
				return callback(null, res.map[key]);
			}

			fs.readFile(src, 'utf-8', (err, source) => {
				if (err) {
					return callback(err);
				}

				var parser = new HeaderParser();
				var data = parser.parse(def, source)

				if (!data) {
					return callback([<any>key, 'bad data']);
				}
				if (data.errors.length > 0) {
					return callback([<any>def, src, data.errors]);
				}
				if (!data.isValid()) {
					return callback([<any>def, 'invalid data']);
				}
				if (data) {
					res.map[key] = data;
				}
				//console.log(util.inspect(data, false, 6));

				return callback(null, data);
			});
		}

		parseDefinitions(projects:Def[], finish:(err?, res?:ImportResult) => void) {
			var self:DefinitionImporter = this;

			var res = new ImportResult();

			async.forEach(projects, (def:Def, callback:(err?, data?) => void) => {

				self.loadDef(def, res, (err?:any, data?:HeaderData) => {
					if (err) {
						//console.log([<any>'err', err]);
						res.error.push(err);
						return callback(null);
						//return callback(err);
					}
					if (!data) {
						res.error.push('no data');
						return callback('null data');
					}

					res.parsed.push(data);

					if (data.references.length > 0) {

						//console.log('references: ' + data.references);

						async.forEach(data.references, (ref, callback:(err?, data?) => void) => {

							var match, dep;
							match= ref.match(dependency);
							if (match && match.length >= 3) {
								dep = new Def(match[1], match[2]);
							}
							else {
								match= ref.match(definition);
								if (match && match.length >= 2) {
									dep = new Def(def.project, match[1]);
								}
							}

							if (dep) {
								//console.log('depencency: ' + match[1]);
								self.loadDef(dep, res, (err?:any, sub?:HeaderData) => {
									if (err) {
										res.error.push(err);
										return callback(null);
									}
									if (!sub) {
										res.error.push(['cannot load dependency', ref]);
										return callback(null);
									}
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
					console.log('err ' + err);
					return finish(err);
				}
				finish(null, res);
			});
		}
	}
}