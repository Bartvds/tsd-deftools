///<reference path="_ref.ts" />

module deftools {

	var path = require('path');
	var fs = require('fs');

	var trailSlash = /(\w)(\/?)$/;

	export class ConfPaths {
		tsd:string;
		typings:string;
		out:string;
		tmp:string;
	}
	export interface NumberMap {
		[name: string]: number;
	}

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