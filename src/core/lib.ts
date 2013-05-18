///<reference path="../_ref.ts" />

module tsdimport {

	var trailSlash = /(\w)(\/?)$/;

	var path = require('path');
	var fs = require('fs');
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
		constructor(public def:Def){

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

	export class HeaderParser {
		//[<\[\{\(]? [\)\}\]>]?

		nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
		labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
		authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
		referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
		endSlash = /\/?$/;

		constructor() {

		}

		parse(def:Def, str:string):HeaderData {
			if (typeof str !== 'string') {
				str = '' + str;
			}

			var i = str.indexOf('//');
			var len = str.length;
			if (i < 0) {
				return null;
			}
			var data = new HeaderData(def);

			this.nameVersion.lastIndex = i;
			this.labelUrl.lastIndex = i;
			this.authorNameUrl.lastIndex = i;

			var err = [];
			var match;

			match = this.nameVersion.exec(str);
			if (!match || match.length < 3) {
				data.errors.push('unparsable name/version line');
			}
			else {
				data.name = match[1];
				data.version = match[2];
				data.submodule =  match.length >= 3 ? match[3] : '';
				this.labelUrl.lastIndex = match.index + match[0].length;
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 2) {
				data.errors.push('unparsable project line');
			}
			else {
				data.projectUrl = match[2];
				this.authorNameUrl.lastIndex = match.index + match[0].length;
			}

			match = this.authorNameUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push('unparsable author line');
			}
			else {
				data.authorName = match[1];
				data.authorUrl = match[2];
				this.labelUrl.lastIndex = match.index + match[0].length;
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push('unparsable repos line');
			}
			else {
				data.reposName = match[1];
				data.reposUrl = match[2].replace(this.endSlash, '/');
			}

			this.referencePath.lastIndex = 0;
			while (match = this.referencePath.exec(str)) {
				if (match.length > 1) {
					data.references.push(match[1]);
				}
			}

			return data;
		}
	}
}