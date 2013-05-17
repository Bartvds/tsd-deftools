///<reference path="../_ref.ts" />

module tsdimport {

	export class Repos {
		constructor(public url:string = '', public local:string = '') {
			//kill trailing  slash
			this.url = this.url.replace(/\/$/, '');
			this.local = this.local.replace(/\/$/, '');
		}
	}

	export class HeaderData {
		errors:any[] = [];
		references:any[] = [];
		dependencies:any[] = [];
		name:string = '';
		version:string = '*';
		description:string = '';
		projectUrl:string = '';

		authorName:string = '';
		authorUrl:string = '';
		reposName:string = '';
		reposUrl:string = '';

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

		nameVersion = /^[ \t]*\/\/[ \t]*Type definitions[\w ]+:?[ \t]+([\w\._\-]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*$/gm;
		labelUrl = /^[ \t]*\/\/[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
		authorNameUrl = /^[ \t]*\/\/[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
		referencePath = /^[ \t]*\/\/\/[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
		endSlash = /\/?$/;

		constructor() {

		}

		parse(str:string):HeaderData {
			if (typeof str !== 'string') {
				str = '' + str;
			}

			var i = str.indexOf('//');
			var len = str.length;
			if (i < 0) {
				return null;
			}
			var data = new HeaderData();

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
				data.authorUrl= match[2];
				this.labelUrl.lastIndex = match.index + match[0].length;
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push('unparsable repos line');
			}
			else {
				data.reposName = match[1];
				data.reposUrl= match[2].replace(this.endSlash, '/');
			}

			this.referencePath.lastIndex = 0;
			while (match = this.referencePath.exec(str)){
				if (match.length > 1) {
					data.references.push(match[1]);
				}
			}

			return data;
		}
	}
}