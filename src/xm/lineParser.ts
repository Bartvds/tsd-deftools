///<reference path="../_ref.ts" />
///<reference path="keyValue.ts" />

module xm {

	var _:UnderscoreStatic = require('underscore');
	var util = require('util');

	export interface LineParserMatcherMap {
		[name: string]:LineParserMatcher;
	}
	export interface LineParserMap {
		[name: string]:LineParser;
	}

	export class LineParserCore {

		matchers:LineParserMatcherMap = {};
		parsers:LineParserMap = {};

		//works nicely but will keep matching empty strings at final line, so guard and compare index + length
		trimmedLine = /([ \t]*)(.*?)([ \t]*)(\r\n|\n|\r|$)/g;

		constructor() {

		}

		addMatcher(type:LineParserMatcher) {
			this.matchers[type.type] = type;
		}

		addParser(parser:LineParser) {
			this.parsers[parser.id] = parser;
		}

		clearParsers() {
			this.parsers = {}
		}

		getInfo() {
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
			console.log('source.length ' + source.length);
			//link all
			this.link();

			var res:LineParserMatch[] = [];
			var possibles:LineParser[] = asType ? this.get(asType) : this.all();

			var length = source.length;
			var line;
			var end;
			var offset = 0;
			var cursor = 0;
			var lineCount = 0;
			var procLineCount = 0;

			var verbose = true;
			var safetyBreak = 100;

			this.trimmedLine.lastIndex = 0;
			while (line = this.trimmedLine.exec(source)) {
				if (verbose) console.log('-----------------------------------------------------------------------------------------');
				cursor = line.index + line[0].length;

				if (cursor >= length) {
					//done
					break;
				}
				lineCount++;
				if (verbose) console.log('line: ' + lineCount);
				/*
				console.log('line:');
				console.log(line);
				console.log('cursor: ' + cursor);
				*/

				this.trimmedLine.lastIndex = cursor;

				//break some development loops :)
				if (lineCount > safetyBreak) {
					//report this better?
					console.log('\n\n\n\nsafetyBreak bail at ' + lineCount + '> ' + safetyBreak + '!\n\n\n\n\n');
					throw('parser safetyBreak bail!');
					break;
				}

				if (line.length < 5) {
					if (verbose) console.log('skip bad line match');
					continue;
				}
				if (typeof line[2] === 'undefined' || line[2] == '') {
					if (verbose) console.log('skip empty line');
					continue;
				}
				procLineCount++;

				var text = line[2];
				if (verbose) console.log('[[' + text + ']]');

				var choice:LineParserMatch[] = _.reduce(possibles, (memo:LineParserMatch[], parser:LineParser) => {
					if (verbose) console.log('---');
					if (verbose) console.log(parser.getName());

					var res = parser.match(text, offset, cursor);
					if (res) {
						if (verbose) console.log('match!');
						//console.log(res);
						memo.push(res);
					}
					return memo;
				}, []);

				if (verbose) console.log('---');

				console.log('choices ' + choice.length);

				if (choice.length == 0) {
					//console.log('cannot match line');
					possibles = [];
				}
				else if (choice.length == 1) {
					console.log('single match line');
					console.log(choice[0].parser.id);
					//console.log(choice[0].match);

					res.push(choice[0]);
					possibles = choice[0].parser.next;
					console.log('switching possibles [' + this.listIds(possibles) + ']');
				}
				else {
					console.log('multi match line');
					console.log(choice[0].parser.id);
					//console.log(choice[0].match);
					//TODO pick one!

					//why not first?
					res.push(choice[0]);
					possibles = choice[0].parser.next;
					console.log('switching possibles [' + this.listIds(possibles) + ']');
				}

				if (possibles.length == 0) {
					console.log('no more possibles, break');
					break;
				}
			}

			console.log('total lineCount ' + lineCount);
			console.log('procLineCount ' + procLineCount);
			//console.log(util.inspect(res, false, 10));
			console.log('res ' + res.length);
			if (res.length > 0) {
				_.each(res, (match:LineParserMatch) => {
					match.extract();
				});
			}
		}
	}

	export class LineParserMatcher {

		//params: type, regexp, value extractor callback
		constructor(public type:string, public exp:RegExp, public extractor:(match:RegExpExecArray) => IKeyValueMap) {
		}

		execute(str:string, offset:number, limit:number):RegExpExecArray {
			this.exp.lastIndex = offset;
			return this.exp.exec(str);
		}

		getName():string {
			return this.type + ' ' + this.exp;
		}
	}
	export class LineParser {

		matcher:LineParserMatcher;
		next:LineParser[] = [];

		//params: id, name of a matcher, callback to apply mater's data, optional list of following parsers
		constructor(public id:string, public type:string, public callback:(fields:IKeyValueMap, match:LineParserMatch) => void, public nextIds:string[] = []) {
		}

		match(str:string, offset:number, limit:number):LineParserMatch {
			if (!this.matcher) {
				return null;
			}
			var match = this.matcher.execute(str, offset, limit);
			if (!match) {
				return null;
			}
			return new LineParserMatch(this, match);
		}

		getName():string {
			return this.id + '/' + (this.matcher ? this.matcher.getName() : this.type + '/unlinked');
		}
	}
	//single match
	export class LineParserMatch {

		constructor(public parser:LineParser, public match:RegExpExecArray) {
		}

		extract():void {
			//hoop hoop!
			this.parser.callback(new KeyValueMap(this.parser.matcher.extractor(this.match)), this);
		}

		getName():string {
			return this.parser.getName();
		}
	}
}