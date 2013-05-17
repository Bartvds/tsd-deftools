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

	export class DefinitionExporter {

		constructor(public repos:Repos) {

		}

		getEncoder():DataEncoder {
			return new Encode_V2(this.repos);
		}

		exportDefinitions(list:HeaderData[], finish:(err?, map?) => void) {
			console.log('exportDefinitions');
			var encoder = this.getEncoder();
			async.forEach(list, (data:HeaderData, callback:(err?, data?) => void) => {
				console.log(data.name);
				console.log(util.inspect(encoder.encode(data), false, 10));

				callback();

			}, (err) => {
				finish(err);
			});
		}
	}

	export interface DataEncoder {
		encode(str:HeaderData):any;
	}

	export class Encode_V2 implements DataEncoder {
		constructor(public repos:Repos) {

		}

		encode(header:HeaderData):any {
			var ret = {
				"name": header.name,
				"description": header.description,
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

	export function getGUID():string {
		var S4 = function () {
			return Math.floor(
			Math.random() * 0x10000 /* 65536 */
			).toString(16);
		};

		return (
		S4() + S4() + "-" +
		S4() + "-" +
		S4() + "-" +
		S4() + "-" +
		S4() + S4() + S4()
		);
	}
}