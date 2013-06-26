///<reference path="_ref.ts" />
///<reference path="../xm/regexp.ts" />
///<reference path="../xm/lineParser.ts" />

module deftools {

	var endSlashTrim = /\/?$/;

	export interface DefMap {
		[name: string]: Def;
	}
	export interface HeaderDataMap {
		[name: string]: deftools.DefData;
	}
	export interface HeaderDataListMap {
		[name: string]:deftools.DefData[];
	}

	//single definition file in repo (non-parsed)
	export class Def {
		constructor(public project:string, public name:string) {
		}

		combi():string {
			return this.project + '/' + this.name;
		}

		toString():string {
			return '[Def ' + this.combi() + ']';
		}
	}
	export class DefAuthor {

		constructor(public name:string = '', public url:string = undefined, public email:string = undefined) {
			if (this.url) {
				this.url = this.url.replace(endSlashTrim, '');
			}
		}

		toString():string {
			return '[' + this.name + (this.email ? ' @ ' + this.email : '') + (this.url ? ' <' + this.url + '>' : '') + ']';
		}

		toJSON():any {
			var obj:any = {name: this.name};
			if (this.url) {
				obj.url = this.url;
			}
			if (this.email) {
				obj.email = this.email;
			}
			return obj;
		}
	}

	//single definition file in repo (parsed)
	export class DefData {
		name:string;
		version:string;
		submodule:string;
		description:string;
		projectUrl:string;

		authors:DefAuthor[];
		//reposName:string;
		reposUrl:string;

		sourcePath:string = '';

		errors:ParseError[];
		references:string[] = [];
		dependencies:deftools.DefData[] = [];

		constructor(public def:Def) {
			if (!this.def) {
				//throw Error('null def');
			}
			this.resetAll();
		}

		resetFields() {
			this.name = '';
			this.version = '*';
			this.submodule = '';
			this.description = '';
			this.projectUrl = '';

			this.authors = []
			//this.reposName = '';
			this.reposUrl = '';
		}

		resetAll() {
			this.resetFields();

			this.errors = [];
			this.references = [];
			this.dependencies = [];
			this.sourcePath = '';
		}

		combi():string {
			if (!this.def) {
				return '[' + this.name + ']';
			}
			return this.def.combi();
		}

		getDefUrl():string {
			if (!this.reposUrl) return '';
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
			if (this.authors.length === 0) {
				return false;
			}
			//!this.reposName ||
			if (!this.reposUrl) {
				return false;
			}
			return true;
		}
	}
}