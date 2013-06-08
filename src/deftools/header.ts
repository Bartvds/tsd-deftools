///<reference path="_ref.ts" />
///<reference path="../xm/regexp.ts" />
///<reference path="../xm/lineParser.ts" />

module deftools {

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

	export interface DefMap {
		[name: string]: Def;
	}

	export interface HeaderDataMap {
		[name: string]: HeaderData;
	}
	export interface HeaderDataListMap {
		[name: string]:HeaderData[];
	}

	export class HeaderData {
		name:string;
		version:string;
		submodule:string;
		description:string;
		projectUrl:string;

		authorName:string;
		authorUrl:string;
		//reposName:string;
		reposUrl:string;

		errors:ParseError[];
		references:string[] = [];
		dependencies:HeaderData[] = [];
		source:string = '';

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

			this.authorName = '';
			this.authorUrl = '';
			//this.reposName = '';
			this.reposUrl = '';
		}

		resetAll() {
			this.resetFields();

			this.errors = [];
			this.references = [];
			this.dependencies = [];
			this.source = '';
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
			if (!this.authorName || !this.authorUrl) {
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