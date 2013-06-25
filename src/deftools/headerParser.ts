///<reference path="_ref.ts" />
///<reference path="../xm/regexp.ts" />
///<reference path="../xm/lineParser.ts" />

module deftools {

	export class ParseError {
		constructor(public message:string = '', public text?:string = '', public ref?:any = null) {

		}
	}

	var endSlashTrim = /\/?$/;

	var glue = xm.RegExpGlue.get;

	//define some reusble RegExps
	var expStart = /^/;
	var expEnd = /$/;
	var spaceReq = /[ \t]+/;
	var spaceOpt = /[ \t]*/;

	var anyGreedy = /.*/;
	var anyLazy = /.*?/;

	var anyGreedyCap = /(.*)/;
	var anyLazyCap = /(.*?)/;

	var identifierCap = /([\w\._-]*(?:[ \t]*[\w\._-]+)*?)/;
	var versionCap = /-?v?(\d+\.\d+\.?\d*\.?\d*)?/;
	var wordsCap = /([\w \t_-]+[\w]+)/;
	var labelCap = /([\w_-]+[\w]+)/;

	var delimStart = /[<\[\{\(]/;
	var delimStartOpt = /[<\[\{\(]?/;
	var delimEnd = /[\)\}\]>]/;
	var delimEndOpt = /[\)\}\]>]?/;

	var seperatorOpt = /[,;]?/;


	//http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
	var urlGroupsCap = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;
	var urlFullCap = /((?:(?:[A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)(?:(?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/;

	//var referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
	var referenceTag = /<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>/;

	//glue long RegExp's from parts
	var commentStart = glue(expStart, spaceOpt, /\/\/+/, spaceOpt).join();
	var optUrl = glue('(?:', spaceOpt, delimStartOpt, urlFullCap, delimEndOpt, ')?').join();

	var commentLine = glue(commentStart)
		.append(anyLazyCap)
		.append(spaceOpt, expEnd)
		.join();

	var referencePath = glue(expStart, spaceOpt, /\/\/\//, spaceOpt)
		.append(referenceTag)
		.append(spaceOpt, expEnd)
		.join();

	var typeHead = glue(commentStart)
		.append(/Type definitions?/, spaceOpt, /(?:for)?:?/, spaceOpt, identifierCap)
		.append(/[ \t:-]+/, versionCap, spaceOpt)
		.append(anyGreedy, expEnd)
		.join('i');

	var projectUrl = glue(commentStart)
		.append(/Project/, spaceOpt, /:?/, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)
		.join('i');


	var defAuthorUrl = glue(commentStart)
		.append(/Definitions[ \t]+by[ \t]*:?/, spaceOpt)
		.append(wordsCap, optUrl)
		.append(spaceOpt, seperatorOpt, spaceOpt, expEnd)
		.join('i');

	var defAuthorUrlAlt = glue(commentStart)
		.append(/Author[ \t]*:?/, spaceOpt)
		.append(wordsCap, optUrl)
		.append(spaceOpt, seperatorOpt, spaceOpt, expEnd)
		.join('i');

	var reposUrl = glue(commentStart)
		.append(/Definitions/, spaceOpt, /:?/, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)
		.join('i');

	var reposUrlAlt = glue(commentStart)
		.append(/DefinitelyTyped/, spaceOpt, /:?/, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)
		.join('i');

	var labelUrl = glue(commentStart)
		.append(labelCap, spaceOpt, /:?/, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)
		.join('i');

	var labelWordsUrl = glue(commentStart)
		.append(labelCap, spaceOpt, /:?/, spaceOpt)
		.append(wordsCap, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)

	var wordsUrl = glue(commentStart)
		.append(wordsCap, spaceOpt)
		.append(delimStartOpt, urlFullCap, delimEndOpt)
		.append(spaceOpt, expEnd)
		.join('i');

	var mutate = (base:string[], add:string[], remove:string[]) => {
		var res = base ? base.slice(0) : [];
		var i , ii, index;
		if (add) {
			for (i = 0, ii = add.length; i < ii; i++) {
				res.push(add[i]);
			}
		}
		if (remove) {
			for (i = 0, ii = remove.length; i < ii; i++) {
				while ((index = res.indexOf(remove[i])) > -1) {
					res.splice(index, 1);
				}
			}
		}
		return res;
	};

	export class HeaderParser {

		parser:xm.LineParserCore;

		constructor(public verbose?:bool = false) {
			this.init();
		}

		init() {

		}

		parse(data:deftools.DefData, source:string):void {
			//console.log('parse: ', data.combi());

			data.resetFields();

			//setup parser
			this.parser = new xm.LineParserCore(this.verbose);

			var fields = ['projectUrl', 'defAuthorUrl', 'defAuthorUrlAlt', 'reposUrl', 'reposUrlAlt', 'referencePath'];

			this.parser.addParser(new xm.LineParser('any', anyGreedyCap, 0, null, ['head', 'any']));

			this.parser.addParser(new xm.LineParser('head', typeHead, 2, (match:xm.LineParserMatch) => {
				data.name = match.getGroup(0, data.name);
				data.version = match.getGroup(1, data.version);
				//data.submodule = match.getGroup(2, data.submodule);
			}, fields));

			fields = mutate(fields, null, ['projectUrl']);

			this.parser.addParser(new xm.LineParser('projectUrl', projectUrl, 1, (match:xm.LineParserMatch) => {
				data.projectUrl = match.getGroup(0, data.projectUrl).replace(endSlashTrim, '');
			}, fields));


			fields = mutate(fields, ['defAuthorAppend'], ['defAuthorUrl','defAuthorUrlAlt']);

			this.parser.addParser(new xm.LineParser('defAuthorUrl', defAuthorUrl, 2, (match:xm.LineParserMatch) => {
				data.authorName = match.getGroup(0, data.authorName);
				data.authorUrl = match.getGroup(1, data.authorUrl).replace(endSlashTrim, '');
			}, fields));

			this.parser.addParser(new xm.LineParser('defAuthorUrlAlt', defAuthorUrlAlt, 2, (match:xm.LineParserMatch) => {
				data.authorName = match.getGroup(0, data.authorName);
				data.authorUrl = match.getGroup(1, data.authorUrl).replace(endSlashTrim, '');
			}, fields));

			this.parser.addParser(new xm.LineParser('defAuthorAppend', wordsUrl, 2, (match:xm.LineParserMatch) => {
				console.log(match);
			}, fields));

			fields = mutate(fields, null, ['defAuthorAppend']);

			fields = mutate(fields, null, ['reposUrl','reposUrlAlt']);

			this.parser.addParser(new xm.LineParser('reposUrl', reposUrl, 1, (match:xm.LineParserMatch) => {
				data.reposUrl = match.getGroup(0, data.reposUrl).replace(endSlashTrim, '');
			}, fields));

			this.parser.addParser(new xm.LineParser('reposUrlAlt', reposUrlAlt, 1, (match:xm.LineParserMatch) => {
				data.reposUrl = match.getGroup(0, data.reposUrl).replace(endSlashTrim, '');
			}, fields));

			this.parser.addParser(new xm.LineParser('referencePath', referencePath, 1, (match:xm.LineParserMatch) => {
				data.references.push(match.getGroup(0));
			}, ['referencePath']));

			this.parser.addParser(new xm.LineParser('comment', commentLine, 0, null, ['comment']));

			//console.log(this.parser.getInfo());

			if (this.verbose) {
				console.log(this.parser.getInfo());
			}

			this.parser.parse(source, ['head']);
		}
	}
}