///<reference path="../_ref.ts" />

module tsdimport {

	export class ParseError {
		constructor(public message:string, public test?:string) {

		}
	}

	export class HeaderParser {
		//[<\[\{\(]? [\)\}\]>]?

		nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
		labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
		authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
		description = /^[ \t]*\/\/\/?[ \t]*Description[ \t]*:[ \t]+([\S *]*\S)[ \t]*$/gm;
		referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
		endSlash = /\/?$/;

		constructor() {

		}

		parse(def:Def, str:string):HeaderData {
			if (typeof str !== 'string') {
				str = '' + str;
			}
			var data = new HeaderData(def);

			var i = str.indexOf('//');
			var len = str.length;
			if (i < 0) {
				data.errors.push(new ParseError('zero comment lines'));
				return data;
			}

			this.nameVersion.lastIndex = i;
			this.labelUrl.lastIndex = i;
			this.authorNameUrl.lastIndex = i;
			this.description.lastIndex = i;
			this.referencePath.lastIndex = i;

			var match;

			match = this.nameVersion.exec(str);
			if (!match || match.length < 3) {
				data.errors.push(new ParseError('unparsable name/version line'));
				return data;
			}
			else {
				data.name = match[1];
				data.version = match[2];
				data.submodule = match.length >= 3 && match[3] ? match[3] : '';
				this.labelUrl.lastIndex = match.index + match[0].length;
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 2) {
				data.errors.push(new ParseError('unparsable project line'));
				return data;
			}
			else {
				data.projectUrl = match[2];
				this.authorNameUrl.lastIndex = match.index + match[0].length;
			}

			match = this.authorNameUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push(new ParseError('unparsable author line'));
				return data;
			}
			else {
				data.authorName = match[1];
				data.authorUrl = match[2];
				this.labelUrl.lastIndex = match.index + match[0].length;
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push(new ParseError('unparsable repos line'));
				return data;
			}
			else {
				//data.reposName = match[1];
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