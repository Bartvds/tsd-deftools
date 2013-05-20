///<reference path="_ref.ts" />

module deftool {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');

	export module Config {

		var paths:ConfPaths;
		var info:ToolInfo;

		export function getPaths():ConfPaths {
			if (paths) return paths;
			var tmp = path.resolve('./tsd-deftools-path.json');
			try {
				paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'))
			}
			catch
			(e) {
				throw(e);
			}
			if (!fs.existsSync(paths.tmp)) {
				fs.mkdir(paths.tmp);
			} else {
				//TODO add some safety checks?
			}
			if (!fs.existsSync(paths.out)) {
				fs.mkdir(paths.out);
			} else {
				//TODO add some safety checks?
			}
			return paths;
		}

		export function getInfo():ToolInfo {
			if (info) return info;
			var pkg;
			try {
				pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
			}
			catch (e) {
				throw(e);
			}
			return info = new ToolInfo(pkg.name, pkg.version, pkg);
		}
	}
}