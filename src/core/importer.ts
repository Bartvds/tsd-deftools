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

	export class DefinitionImporter {


		constructor(public repos:Repos) {

		}

		loadDef(name:string, map:any, callback:(err, data?) => void) {
			var src = path.resolve(this.repos.local + '/' + name + '/' + name + '.d.ts');
			var self:DefinitionImporter = this;
			console.log('name: ' + name);
			console.log('src: ' + src);

			if (map.hasOwnProperty(name)) {
				console.log('from cache: ' + name);
				return callback(null, map[name]);
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
					map[data.name] = data;
				}

				//console.log(util.inspect(data, false, 6));

				/*var encoder = new Encode_V2();
				var v2 = encoder.encode(data);

				console.log(util.inspect(v2, false, 6));*/

				return callback(null, data);
			});
		}

		parseDefinitions(projects:string[], finish:(err?, map?) => void) {
			var self:DefinitionImporter = this;
			var map = {};
			var res:HeaderData[] = [];

			async.forEach(projects, (name, callback:(err?, data?) => void) => {

				self.loadDef(name, map, (err?:any, data?:HeaderData) => {
					console.log('LOADED ' +  name);
					if (err) {
						console.log([<any>'err', err]);
						console.log(err);
						return callback(null);
						//return callback(err);
					}
					if (!data) {
						console.log('no data');
						return callback('null data');
					}
					res.push(data);

					if (data.references.length > 0) {

						console.log('references: ' + data.references);

						async.forEach(data.references, (ref, callback:(err?, data?) => void) => {

							var match = ref.match(dependency);
							if (match && match.length >= 3) {
								if (match[1] && match[2]) {
									console.log('depencency: ' + match[1]);

									self.loadDef(match[1], map, (err?:any, sub?:HeaderData) => {
										if (err) {
											return callback(err);
										}
										if (!sub) {
											return callback(['cannot load dependency', ref]);
										}
										console.log('save dependency: ' + match[1]);
										console.log('save in: ' + data.name);
										data.dependencies.push(sub);
										return callback(null, data);
									});
									return;
								}
							}
							return callback(['bad reference', ref]);

						}, (err) => {
							console.log('looped references');
							callback(err);
						});
					} else {
						callback(null, data);
					}
				});
			}, (err) => {
				if (err) {
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