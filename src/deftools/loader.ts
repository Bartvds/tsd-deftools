///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	var stripExt = /(\.[\w_-]+)$/;
	var ignoreFile = /^[\._]/;
	var extJson = /\.json$/;
	var extDef = /\.d\.ts$/;

	//load various file listings from Repos paths
	export class ListLoader {

		constructor(public repos:Repos) {

		}

		loadRepoProjectDefs(project:string, finish:(err, res:Def[]) => void) {
			project = path.basename(project);

			var ret:Def[] = [];
			var self:ListLoader = this;
			var src = path.join(self.repos.defs, project);

			//console.log('-> project: ' + project);

			fs.exists(src, (exists) => {
				if (!exists) return finish('not exists', ret);

				fs.stat(src, (err, stats) => {
					if (err) return finish(err, ret);
					if (!stats.isDirectory()) return finish('not directory', ret);

					fs.readdir(src, (err, files:string[]) => {
						if (err) return finish(err, ret);

						files = _(files).filter((name) => {
							return extDef.test(name);
						});

						if (files.length == 0) {
							return finish(null, ret);
						}

						async.forEach(files, (name, callback:(err) => void) => {
							//src + '/' + file + '/' + sub;
							var tmp = path.join(src, name);
							fs.stat(tmp, (err, stats) => {
								if (err) return callback(err);
								if (stats.isDirectory()) return callback(null);

								//console.log('-> def ' + name);
								ret.push(new Def(project, name.replace(extDef, '')));
								callback(null);
							});
						}, (err) => {
							finish(err, ret);
						});
					});
				});
			});
		}

		loadRepoDefs(finish:(err, res:Def[]) => void) {
			var self:ListLoader = this;
			fs.readdir(self.repos.defs, (err, files:string[]) => {
				if (err) return finish(err, []);

				async.reduce(files, [], (memo:Def[], file, callback:(err,  memo?:Def[]) => void) => {
					if (ignoreFile.test(file)) {
						return callback(null, memo);
					}
					self.loadRepoProjectDefs(file, (err, res:Def[]) => {
						if (err) return callback(err);
						if (!res) return callback('no res for ' + file);

						_.each(res, (def:Def) => {
							memo.push(def);
						});
						callback(null, memo);
					});

				}, (err, memo) => {
					finish(err, memo);
				});
			});
		}

		loadTsdNames(finish:(err, res:string[]) => void) {
			var self:ListLoader = this;
			fs.readdir(self.repos.tsd + 'repo_data', (err, files:string[]) => {
				if (err) return finish(err, []);

				finish(null, _(files).filter((value) => {
					return !ignoreFile.test(value) && extJson.test(value);
				}).map((value) => {
					return value.replace(stripExt, '');
				}));
			});
		}
	}
}