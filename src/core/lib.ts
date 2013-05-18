///<reference path="../_ref.ts" />

module tsdimport {

	var path = require('path');
	var fs = require('fs');

	var trailSlash = /(\w)(\/?)$/;

	export interface ConfPaths {
		tsd:string;
		out:string;
		tmp:string;
		DefinitlyTyped:string;
		local:string;
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

	export class ToolInfo {
		constructor(public name:string, public version:string, public pkg:any) {
			if (!this.name) throw Error('no name');
			if (!this.version) throw Error('no version');
			if (!this.pkg) throw Error('no pkg');
		}

		getString():string {
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

	export class HeaderData {
		name:string = '';
		version:string = '*';
		submodule:string = '';
		description:string = '';
		projectUrl:string = '';

		authorName:string = '';
		authorUrl:string = '';
		reposName:string = '';
		reposUrl:string = '';

		errors:any[] = [];
		references:any[] = [];
		dependencies:any[] = [];

		constructor(public def:Def) {

		}

		getDefUrl():string {
			if (!this.def) return '';
			return this.reposUrl + this.def.project + '/' + this.def.name + '.d.ts';
		}

		isValid():bool {
			if (this.errors.length > 0) {
				return false;
			}
			// || !this.description
			if (!this.name || !this.version || !this.projectUrl) {
				return false;
			}
			if (!this.authorName || !this.authorUrl) {
				return false;
			}
			if (!this.reposName || !this.reposUrl) {
				return false;
			}
			return true;
		}
	}
}