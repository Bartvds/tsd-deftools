///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async = require('async');
	var _:UnderscoreStatic = require('underscore');

	export module helper {

		export function removeFilesFromDir(dir:string, callback:AsyncCallback) {

			dir = path.resolve(dir);

			fs.exists(dir, (exists:bool) => {
				if (!exists) return callback('path does not exists: ' + dir, null);

				async.waterfall([
					(callback:AsyncCallback) => {
						return fs.stat(dir, callback);
					},
					(stats, callback:AsyncCallback) => {
						if (!stats.isDirectory()) {
							return callback('path is not a directory: ' + dir, null);
						}
						return fs.readdir(dir, callback);
					},
					(files:string[], callback:AsyncCallback) => {
						//check each file
						async.forEach(files, (file:string, callback:AsyncCallback) => {
							var full = path.join(dir, file);
							fs.stat(full, (err, stats)=> {
								if (err) return callback(err, null);
								if (stats.isFile()) {
									return fs.unlink(full, callback);
								}
								return callback(null, null);
							})
						}, callback);
					}
				], callback);
			});
		}
	}
}