///<reference path="../_ref.ts" />
///<reference path="lib.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	var agent:SuperAgent = require('superagent');

	var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/

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

		loadDef(name:string, res:ImportResult, callback:(err, data?) => void) {
			var src = path.resolve(this.repos.defs + name + '/' + name + '.d.ts');
			var self:DefinitionImporter = this;

			if (res.map.hasOwnProperty(name)) {
				console.log('from cache: ' + name);
				return callback(null, res.map[name]);
			}

			fs.readFile(src, 'utf-8', (err, source) => {
				if (err) {
					return callback(err);
				}

				var parser = new HeaderParser();
				var data = parser.parse(source)

				if (!data) {
					return callback([<any>name, 'bad data']);
				}
				if (data.errors.length > 0) {
					return callback([<any>name, src, data.errors]);
				}
				if (!data.isValid()) {
					return callback([<any>name, 'invalid data']);
				}
				if (data) {
					res.map[data.name] = data;
				}
				//console.log(util.inspect(data, false, 6));

				return callback(null, data);
			});
		}

		parseDefinitions(projects:string[], finish:(err?, res?:ImportResult) => void) {
			var self:DefinitionImporter = this;

			var res = new ImportResult();

			async.forEach(projects, (name, callback:(err?, data?) => void) => {

				self.loadDef(name, res, (err?:any, data?:HeaderData) => {
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

							var match = ref.match(dependency);
							if (match && match.length >= 3) {
								if (match[1] && match[2]) {
									//console.log('depencency: ' + match[1]);

									self.loadDef(match[1], res, (err?:any, sub?:HeaderData) => {
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
							}
							return callback(['bad reference', ref]);

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

		loadDescription(data:HeaderData, callback:(err) => void) {
			if (data.description) {
				callback(null);
			}
		}
	}
}