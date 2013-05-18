///<reference path="_ref.ts" />
///<reference path="lib.ts" />

module tsdimport {


	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	export class ExportResult {
		created:HeaderExport[] = [];
		constructor() {

		}
	}
	export class HeaderExport {
		constructor(public header:HeaderData, public path:string) {
		}
	}

	export class DefinitionExporter {

		constructor(public repos:Repos, public info:ToolInfo) {

		}

		getEncoder():DataEncoder {
			return new Encode(this.repos, this.info);
		}

		writeDef(data:HeaderData, encoder:DataEncoder, finish:(err?, exp?:HeaderExport) => void) {
			//console.log(util.inspect(encoder.encode(data), false, 10));

			var dest = this.repos.out + data.def.name + '.json';
			//console.log(dest);
			var exp = new HeaderExport(data, dest);

			fs.exists(dest, (exists:bool) => {
				if (exists) {
					return finish('file exists: ' + dest);
				}
				var obj = encoder.encode(data);
				//console.log(util.inspect(obj, true, 8));

				fs.writeFile(dest, JSON.stringify(obj, null, 4), (err) => {
					finish(err, exp);
				});
			});
		}

		exportDefinitions(list:HeaderData[], finish:(err?, res?:ExportResult) => void) {
			var self:DefinitionExporter = this;
			var encoder = this.getEncoder();
			var res = new ExportResult();
			async.forEach(list, (data:HeaderData, callback:(err?, data?) => void) => {

				console.log('writeDef ' + data.name);
				self.writeDef(data, encoder, (err?, exp?:HeaderExport) => {
					if (err)  return callback(err);
					if (data) {
						res.created.push(exp);
					}
					callback(null, exp);
				});

			}, (err) => {
				finish(err, res);
			});
		}
	}

	export interface DataEncoder {
		encode(str:HeaderData):any;
	}
	export class Encode implements DataEncoder {
		constructor(public repos:Repos, public info:ToolInfo) {

		}
		encode(header:HeaderData):any {
			var ret = {
				"name": header.def.name,
				"description": header.name + (header.submodule ? ' (' + header.submodule + ')' : '') + (header.submodule ? ' ' + header.submodule : ''),
				"generated": <any> this.info.getNameVersion() + ' @ ' + new Date().toUTCString(),
				"versions": [
					{
						"version": header.version,
						"key": getGUID(),
						"dependencies": _.map(header.dependencies, (data:HeaderData) => {
							return {
								"name": data.name,
								"version": data.version
							}
						}),
						"url": header.getDefUrl(),
						"author": header.authorName,
						"author_url": header.authorUrl
					}
				]
			};
			return ret;
		}
	}
}