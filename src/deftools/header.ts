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
			this.reset();
		}

		reset() {
			this.name = '';
			this.version = '*';
			this.submodule = '';
			this.description = '';
			this.projectUrl = '';

			this.authorName = '';
			this.authorUrl = '';
			//this.reposName = '';
			this.reposUrl = '';

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
			console.log('parse ', data.combi());

			//shortcut the glue
			var glue = xm.RegExpGlue.get;

			//define some reusble RegExps
			var expStart = /^/;
			var expEnd = /$/;
			var spaceReq = /[ \t]+/;
			var spaceOpt = /[ \t]*/;
			var commentStart = /\/\/+/;

			var anyGreedy = /.*/;
			var anyLazy = /.*?/;

			var anyGreedyCap = /(.*)/;
			var anyLazyCap = /(.*?)/;

			var identifierCap = /([\w\._-]*(?:[ \t]*[\w\._-]+)*?)/;
			var versionCap = /v?(\d+\.\d+\.?\d*\.?\d*)?/;

			var headStart = /Type definitions?[ \t]*(?:for)?:?/;
			var projectStart = /Project[ \t]*:?/;

			var delimStart = /[<\[\{\(]/;
			var delimEnd = /[\)\}\]>]/;
			//http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
			var urlGroupsCap = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;
			var urlFullCap = /((?:(?:[A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)(?:(?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

			//glue long RegExp's from parts
			var commentStart = glue(expStart, spaceOpt, commentStart, spaceOpt).join();

			var commentLine = glue(commentStart)
			.append(anyLazyCap)
			.append(spaceOpt, expEnd)
			.join();

			var typeHead = glue(commentStart)
			.append(headStart, spaceOpt, identifierCap)
			.append(spaceReq, versionCap, spaceOpt)
			.append(anyGreedy, expEnd)
			.join();

			var projectUrl = glue(commentStart)
			.append(headStart, spaceOpt, identifierCap)
			.append(spaceReq, versionCap, spaceOpt)
			.append(anyGreedy, expEnd)
			.join();

			//setup parser
			var parser = new xm.LineParserCore();

			//define reusable matching + extractors
			//return: a plain object with the values
			parser.addMatcher(new xm.LineParserMatcher('comment', commentLine, (match:RegExpExecArray) => {
				if (match.length < 2) return null;
				return {text:match[1]};
			}));
			parser.addMatcher(new xm.LineParserMatcher('headNameVersion', typeHead, (match:RegExpExecArray) => {
				if (match.length < 3) return null;
				var ret:any = {};
				ret.name = match[1],
				ret.version = match[2];
				return ret;
			}));

			//define reusable line parsers

			parser.addParser(new xm.LineParser('head', 'headNameVersion', (fields:xm.IKeyValueMap, match:xm.LineParserMatch) => {
				console.log('extract ' + match.parser.getName());
				data.name = fields.get('name');
				data.version = fields.get('version', data.version);
				data.submodule = fields.get('submodule', data.submodule);
				return;
			}, ['comment']));

			parser.addParser(new xm.LineParser('comment', 'comment', (fields:xm.IKeyValueMap, match:xm.LineParserMatch) => {
				console.log(fields);
			}, ['comment']));

			/*parser.addParser(new xm.LineParser('any', 'line', (match:RegExpExecArray, parent:xm.LineParserMatch[], parser:xm.LineParser) => {
				console.log('apply');
				console.log(parser.getName());
				console.log(match);
			}));*/
			console.log(parser.getInfo());

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