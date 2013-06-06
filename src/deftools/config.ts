///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');

	export module Config {

		export function getPaths(src?:string):ConfPaths {
			var paths:ConfPaths;
			if (typeof src === 'undefined') {
				src = './tsd-deftools-path.json';
			}
			src = path.resolve(src);
			try {
				paths = JSON.parse(fs.readFileSync(src, 'utf8'))
			}
			catch
			(e) {
				throw(e);
			}

			if (!fs.existsSync(paths.typings)) {
				throw ('typings does not exist ' + paths.typings);
			}
			if (!fs.existsSync(paths.tsd)) {
				throw ('tsd does not exist ' + paths.tsd);
			}

			if (!fs.existsSync(paths.tmp)) {
				fs.mkdir(paths.tmp);
				console.log('Config created paths.tmp ' + paths.tmp);
			} else {
				//TODO add some safety checks?
			}
			if (!fs.existsSync(paths.out)) {
				fs.mkdir(paths.out);
				console.log('Config created paths.out ' + paths.out);
			} else {
				//TODO add some safety checks?
			}
			return paths;
		}

		export function getInfo():ToolInfo {
			var pkg;
			try {
				pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
			}
			catch (e) {
				throw(e);
			}
			return new ToolInfo(pkg.name, pkg.version, pkg);
		}
	}
}