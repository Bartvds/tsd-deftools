///<reference path="_ref.ts" />

module tsdimport {

	var _:UnderscoreStatic = require('underscore');

	export interface LineParserMatcherMap {
		[name: string]:LineParserMatcher;
	}
	export interface LineParserMap {
		[name: string]:LineParser;
	}
	export class LineParserCore {

		matchers:LineParserMatcherMap = {};
		parsers:LineParserMap = {};

		trimmedine = /^([\ t]*)?(\S+(?:[ \t]+\S+)*)*[ \t]*$/gm;


		constructor() {

		}

		addMatcher(type:LineParserMatcher) {
			this.matchers[type.type] = type;
		}

		addParser(parser:LineParser) {
			this.parsers[parser.id] = parser;
		}

		info() {
			var ret:any = {};
			ret.types = _.keys(this.matchers).sort();
			ret.parsers = _.keys(this.parsers).sort();
			return ret;
		}
		getMatcher(type:string):LineParserMatcher {
			if (!this.matchers.hasOwnProperty(type)) {
				console.log('missing matcher id ' + type);
				return null;
			}
			return this.matchers[type];
		}
		getParser(id:string):LineParser {
			if (!this.parsers.hasOwnProperty(id)) {
				console.log('missing parser id ' + id);
				return null;
			}
			return this.parsers[id];
		}

		link() {
			var self:LineParserCore = this;
			_.each(this.parsers, (parser:LineParser) => {
				parser.matcher = self.getMatcher(parser.type);

				_.each(parser.nextIds, (type:string) => {
					var p = self.getParser(type);
					if (p) {
						parser.next.push(p);
					}
				});
			});


		}

		get(ids:string[]):LineParser[] {
			var self:LineParserCore = this;
			return _.reduce(ids, (memo:LineParser[], id:string) => {
				if (!self.parsers.hasOwnProperty(id)) {
					console.log('missing parser ' + id);
					return memo;
				}
				memo.push(self.parsers[id]);
				return memo;
			}, []);
		}

		all():LineParser[] {
			return _.toArray(this.parsers);
		}

		listIds(parsers:LineParser[]):string[] {
			return _.reduce(parsers, (memo:string[], parser:LineParser) => {
				memo.push(parser.id);
				return memo;
			}, []);
		}

		parse(source:string, asType?:string[]) {
			console.log('source');
			console.log(source.length);
			//link all
			this.link();

			var res:LineParserMatch[] = [];
			var possibles:LineParser[] = asType ? this.get(asType) : this.all();

			var line;
			var offset = 0;
			var end = 0;
			var count = 0;

			this.trimmedine.lastIndex = 0;
			while (line = this.trimmedine.exec(source)) {

				end = line.index + line.length;
				this.trimmedine.lastIndex = end;

				count++;
				if (line.length < 2) {
					continue;
				}
				if (typeof line[2] === 'undefined') {
					continue;
				}
				var text = line[2];

				console.log('line ' + count);

				var choice:LineParserMatch[] = [];

				_.reduce(possibles, (memo:LineParserMatch[], parser:LineParser) => {
					var res = parser.match(text, offset, end);
					if (res) {
						console.log('match at line ' + count + ' ' + offset + '-' + end + ' ' + parser.getName());
						//console.log(res);
						memo.push(res);
					}
					return memo;
				}, choice);

				console.log('choices ' + choice.length);


				if (choice.length == 0) {
					//console.log('cannot match line');
					possibles = [];
				}
				else if (choice.length == 1) {
					console.log('single match line');
					console.log(choice[0]);

					possibles = choice[0].parser.next;
					console.log('switching possibles ' + this.listIds(possibles));
				}
				else {
					console.log('multi match line');
					console.log(choice);
				}

				if (possibles.length == 0) {
					console.log('no more possibles');
					break;
				}
			}

			console.log('lines' + count);
			return res;
		}
	}

	export class LineParserMatcher {
		constructor(public type:string, public exp:RegExp, public extractor:(match:RegExpExecArray) => any) {

		}

		match(str:string, offset:number, limit:number):RegExpExecArray {
			this.exp.lastIndex = offset;
			return this.exp.exec(str);
		}

		getName() {
			return this.type + ':' + this.exp;
		}
	}
	export class LineParser {

		matcher:LineParserMatcher;
		next:LineParser[] = [];

		constructor(public id:string, public type:string, public callback:(match:RegExpExecArray, parent:LineParserMatch[], parser:LineParser) => void, public nextIds:string[] = []) {

		}

		match(str:string, offset:number, limit:number):LineParserMatch {
			if (!this.matcher) {
				return null;
			}
			var match = this.matcher.match(str, offset, limit);
			if (!match) {
				return null;
			}
			return new LineParserMatch(this, match);
		}

		getName() {
			return this.id + ':' + this.type + '/' + (this.matcher ? this.matcher.getName() : 'unlinked');
		}
	}

	export class LineParserMatch {
		constructor(public parser:LineParser, public match:RegExpExecArray) {

		}

		execute(parent:LineParserMatch[]) {
			return this.parser.callback(this.match, parent, this.parser);
		}

		getName() {
			return this.parser.getName();
		}
	}
}