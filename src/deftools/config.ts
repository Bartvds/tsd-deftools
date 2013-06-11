///<reference path="_ref.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');

	var trailSlash = /(\w)(\/?)$/;

	export class ConfPaths {
		tsd:string;
		typings:string;
		out:string;
		tmp:string;
	}

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

	//for debug and reporting
	export class ToolInfo {
		constructor(public name:string, public version:string, public pkg:any) {
			if (!this.name) throw Error('no name');
			if (!this.version) throw Error('no version');
			if (!this.pkg) throw Error('no pkg');
		}

		getNameVersion():string {
			return this.name + ' ' + this.version
		}
	}

	//core process paths
	export class Repos {
		constructor(public defs:string, public tsd:string, public out:string) {

			//let's check these pedantically
			if (!this.defs) {
				throw('missing local')
			}
			if (!this.tsd) {
				throw('missing tsd')
			}
			if (!this.out) {
				throw('missing out')
			}

			this.defs = path.resolve(this.defs).replace(trailSlash, '$1/');
			this.tsd = path.resolve(this.tsd).replace(trailSlash, '$1/');
			this.out = path.resolve(this.out).replace(trailSlash, '$1/');

			if (!fs.existsSync(this.defs) || !fs.statSync(this.defs).isDirectory()) {
				throw new Error('path not exist or not directoy: ' + this.defs);
			}
			if (!fs.existsSync(this.tsd) || !fs.statSync(this.tsd).isDirectory()) {
				throw new Error('path not exist or not directoy: ' + this.tsd);
			}
			if (!fs.existsSync(this.out) || !fs.statSync(this.out).isDirectory()) {
				throw new Error('path not exist or not directoy: ' + this.out);
			}
		}
	}
}