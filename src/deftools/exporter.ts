///<reference path="_ref.ts" />

module deftools {


	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	//list what we exported
	export class ExportResult {
		created:HeaderExport[] = [];
		constructor() {

		}
	}
	//single export
	export class HeaderExport {
		constructor(public header:HeaderData, public path:string) {
		}
	}

	//export HeaderData to tsd JSON in Repos
	export class DefinitionExporter {

		constructor(public repos:Repos, public info:ToolInfo) {

		}

		getEncoder():DataEncoder {
			return new Encode(this.repos, this.info);
		}
		//write single HeaderData to Repos
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

		//bulk write single HeaderData's to Repos
		exportDefinitions(list:HeaderData[], finish:(err?, res?:ExportResult) => void) {
			var self:DefinitionExporter = this;
			var encoder = this.getEncoder();
			var res = new ExportResult();
			async.forEach(list, (data:HeaderData, callback:(err?, data?) => void) => {

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

	//encode single HeaderData
	export interface DataEncoder {
		encode(str:HeaderData):any;
	}

	//encode single HeaderData to tsd json format
	export class Encode implements DataEncoder {
		constructor(public repos:Repos, public info:ToolInfo) {

		}
		encode(header:HeaderData):any {
			var ret = {
				"name": header.def.name,
				"description": header.name + (header.submodule ? ' (' + header.submodule + ')' : '') + (header.submodule ? ' ' + header.submodule : ''),
				"versions": [
					{
						"version": header.version,
						"key": getGUID(),
						"dependencies": _.map(header.dependencies, (data:HeaderData) => {
							return {
								"valid": data.isValid(),
								"name": data.def.name,
								"version": data.version
							}
						}),
						"url": header.getDefUrl(),
						"author": header.authorName,
						"author_url": header.authorUrl
					}
				],
				"generator" : {
					"name": this.info.getNameVersion(),
					"date": new Date().toUTCString(),
					"valid": header.isValid()
				}
			};
			return ret;
		}
	}
}