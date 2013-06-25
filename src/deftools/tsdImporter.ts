///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/
	var definition = /^([\w _-]+)\.d\.ts$/

	export class TsdImportResult {
		all:deftools.DefData[] = [];

		constructor() {

		}

		urlMatch(pattern:RegExp, invert:bool=false, list:any[] = null):any[] {
			list = list || this.all;
			return _.filter(list, (value:any) => {
				var ret = true;
				_.each(value.versions, (version:any) => {
					ret = ret && (pattern.test(version.url));
				});
				if (invert) {
					ret = !ret;
				}
				return ret;
			});
		}
	}

	//parse headers for a list of Def's from Repos
	export class TsdImporter {

		constructor(public repos:Repos) {

		}

		parseRepoData(names:string[], finish:(err?, res?:TsdImportResult) => void) {
			var self:TsdImporter = this;

			async.reduce(names, new TsdImportResult(), (res:TsdImportResult, name:string, callback:(err?, data?:TsdImportResult) => void) => {

				var p = path.join(self.repos.tsd, 'repo_data', name + '.json');

				fs.readFile(p, 'utf8', (err, content:string) => {
					if (err) return callback(err);
					if (!content) return callback('no content');

					var obj;
					try {
						obj = JSON.parse(content);
					} catch (e) {
						return callback(e);
					}
					if (obj) {
						res.all.push(obj);
					}
					callback(null, res);
				});


			}, (err?, res?:TsdImportResult) => {

				finish(err, res)
			});
		}
	}
}