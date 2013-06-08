///<reference path="_ref.ts" />
///<reference path="parser.ts" />
///<reference path="../xm/regexp.ts" />

module deftools {

	export class Def {
		key:string;

		constructor(public project:string, public name:string) {
			this.key = this.combi();
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
		name:string = '';
		version:string = '*';
		submodule:string = '';
		description:string = '';
		projectUrl:string = '';

		authorName:string = '';
		authorUrl:string = '';
		//reposName:string = '';
		reposUrl:string = '';

		errors:ParseError[] = [];
		references:string[] = [];
		dependencies:HeaderData[] = [];
		source:string = '';

		constructor(public def:Def) {
			if (!this.def) {
				//throw Error('null def');
			}
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

	export class ParseError {
		constructor(public message:string = '', public text?:string = '', public ref?:any = null) {

		}
	}

	//var typeHead  = /^([ \t]*)?(\/\/\/?[ \t]*Type definitions?[ \t]*(?:for)?:?[ \t]+)([\w\._-]*(?:[ \t]*[\w\._-]+))[ \t]([\w\._-]*(?:[ \t]*[\w\._-]+))[ \t]v?[ \t]*(\d+(?:\.\d+)*)?[ \t]*[<\[\{\(]?([\w\._-]*(?:[ \t]*[\w\._-]+))*[ \t]*[\)\}\]>]?[ \t]*(\S*(?:[ \t]*\S+)*)[ \t]*$/;

	export class HeaderParser {

		constructor(){

		}
/*
^([ \t]*)?\/\/\/?
[ \t]*
Type definitions?[ \t]*(?:for[ \t]*)?:?[ \t]*
[ \t]+
([\w\._-]*(?:[ \t]*[\w\._-]+))
[ \t]+
([\w\._-]*(?:[ \t]*[\w\._-]+))
[ \t]+
?[ \t]*(\d+\.\d+\.?\d*\.?\d*)
[ \t]+
[<\[\{\(]?
[ \t]*
([\w\._-]+(?:[ \t]*[\w\._-]+))*
[ \t]*
[\)\}\]>]?
[ \t]*(\S*(?:[ \t]*\S+)*)[ \t]*$
*/


		parse(data:HeaderData, source:string):HeaderData {
			console.log('parse');
			console.log(data.combi());

			var parser = new LineParserCore();

			var expStart = /^/;
			var expEnd = /$/;
			var spaceReq = /[ \t]+/;
			var spaceOpt = /[ \t]*/;
			var commentStart = /\/\/+/;
			var anyGreedy = /(.*)/;
			var anyLazy = /(.*?)/;
			var headStart = /Type definitions?[ \t]*(?:for)?:?/;
			var identify = /([\w\._-]*(?:[ \t]*[\w\._-]+))/;

			var glue = xm.RegExpGlue.get;

			var typeHead = glue(expStart, spaceOpt, commentStart, spaceOpt);
			typeHead.append(headStart, spaceOpt, identify);
			//typeHead.append(lineEnd);

			var comment = glue(expStart, spaceOpt);
			comment.append(commentStart, spaceOpt, anyLazy);
			comment.append(spaceOpt, expEnd);
			console.log(comment.join());

			parser.addMatcher(new LineParserMatcher('comment', comment.join(), (match:RegExpExecArray) => {
				if (match.length < 2) {
					return;
				}
				console.log('comment: ' + match[1]);
			}));
			//parser.addMatcher(new LineParserMatcher('line', /^(.*)$/));
			parser.addMatcher(new LineParserMatcher('headNameVersion', typeHead.join(), (match:RegExpExecArray) => {
				if (match.length < 5) {
					return;
				}
				data.name = match[4];
				data.version = match[5];
			}));

			parser.addParser(new LineParser('head', 'headNameVersion', (match:RegExpExecArray, parent:LineParserMatch[], parser:LineParser) => {
				console.log('apply');
				console.log(parser.getName());
				console.log(match);
				console.log(parser.matcher.extractor(match));
			}, ['comment']));
			parser.addParser(new LineParser('comment', 'comment', (match:RegExpExecArray, parent:LineParserMatch[], parser:LineParser) => {
				console.log('apply');
				console.log(parser.getName());
				console.log(match);
				console.log(parser.matcher.extractor(match));
			}, ['comment']));

			/*parser.addParser(new LineParser('any', 'line', (match:RegExpExecArray, parent:LineParserMatch[], parser:LineParser) => {
				console.log('apply');
				console.log(parser.getName());
				console.log(match);
			}));*/
			console.log(parser.info());

			parser.parse(source, ['head']);


			return data;
		}
	}

	export class HeaderParserOri {
		//[<\[\{\(]? [\)\}\]>]?

		nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
		labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
		authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
		description = /^[ \t]*\/\/\/?[ \t]*Description[ \t]*:[ \t]+([\S *]*\S)[ \t]*$/gm;
		referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
		endSlash = /\/?$/;

		cursor = 0;

		constructor() {

		}

		reset() {
			this.cursor = 0;
		}

		moveCursor(index) {
			this.cursor += index;
			this.applyCursor();
		}

		setCursor(index) {
			this.cursor = index;
			this.applyCursor();
		}

		applyCursor() {
			this.nameVersion.lastIndex = this.cursor;
			this.labelUrl.lastIndex = this.cursor;
			this.authorNameUrl.lastIndex = this.cursor;
			this.description.lastIndex = this.cursor;
			this.referencePath.lastIndex = this.cursor;
		}

		parse(data:HeaderData, str:string):HeaderData {
			//buffers.. do we need it or just voodoo zombie cargo cult mode code?
			if (typeof str !== 'string') {
				str = '' + str;
			}

			var cursor = str.indexOf('//');
			var len = str.length;
			if (cursor < 0) {
				data.errors.push(new ParseError('zero comment lines'));
				return data;
			}
			this.setCursor(cursor);

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

				this.setCursor(match.index + match[0].length);
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 2) {
				data.errors.push(new ParseError('unparsable project line'));
				return data;
			}
			else {
				data.projectUrl = match[2];
				this.setCursor(match.index + match[0].length);
			}

			match = this.authorNameUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push(new ParseError('unparsable author line'));
				return data;
			}
			else {
				data.authorName = match[1];
				data.authorUrl = match[2];
				this.setCursor(match.index + match[0].length);
			}

			match = this.labelUrl.exec(str);
			if (!match || match.length < 3) {
				data.errors.push(new ParseError('unparsable repos line'));
				return data;
			}
			else {
				//data.reposName = match[1];
				data.reposUrl = match[2].replace(this.endSlash, '/');
				this.setCursor(match.index + match[0].length);
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