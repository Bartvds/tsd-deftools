///<reference path="../_ref.ts" />
///<reference path="keyValue.ts" />

module xm {

	var _:UnderscoreStatic = require('underscore');
	var util = require('util');

	export class LineParserCore {

		parsers = new xm.KeyValueMap();

		//works nicely but will keep matching empty strings at final line, so guard and compare index + length
		trimmedLine = /([ \t]*)(.*?)([ \t]*)(\r\n|\n|\r|$)/g;

		constructor(public verbose?:bool = false) {

		}

		addParser(parser:LineParser) {
			this.parsers.set(parser.id, parser);
		}

		getInfo() {
			var ret:any = {};
			ret.parsers = this.parsers.keys().sort();
			return ret;
		}

		getParser(id:string):LineParser {
			return this.parsers.get(id, null);
		}

		link() {
			var self:LineParserCore = this;
			_.each(this.parsers.values(), (parser:LineParser) => {
				_.each(parser.nextIds, (id:string) => {
					var p = self.parsers.get(id);
					if (p) {
						parser.next.push(p);
					}
					else {
						console.log('cannot find parser: ' + id);
					}
				});
			});
		}

		get(ids:string[]):LineParser[] {
			var self:LineParserCore = this;
			return _.reduce(ids, (memo:LineParser[], id:string) => {
				if (!self.parsers.has(id)) {
					console.log('missing parser ' + id);
					return memo;
				}
				memo.push(self.parsers.get(id));
				return memo;
			}, []);
		}

		all():LineParser[] {
			return this.parsers.values();
		}

		listIds(parsers:LineParser[]):string[] {
			return _.reduce(parsers, (memo:string[], parser:LineParser) => {
				memo.push(parser.id);
				return memo;
			}, []);
		}

		parse(source:string, asType?:string[]) {

			var log = this.verbose ? (...rest:any[]) => {
				console.log.apply(console, rest);
			} : (...rest:any[]) => {
				//ignore
			};

			log('source.length: ' + source.length);
			log('asType: ' + asType);
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

			var safetyBreak = 10000;

			this.trimmedLine.lastIndex = 0;
			while (line = this.trimmedLine.exec(source)) {
				log('-----------------------------------------------------------------------------------------');
				cursor = line.index + line[0].length;

				if (cursor >= length) {
					//done
					break;
				}
				lineCount++;
				log('line: ' + lineCount);
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
					log('skip bad line match');
					continue;
				}
				if (typeof line[2] === 'undefined' || line[2] == '') {
					log('skip empty line');
					continue;
				}
				procLineCount++;

				var text = line[2];
				log('[[' + text + ']]');

				var choice:LineParserMatch[] = _.reduce(possibles, (memo:LineParserMatch[], parser:LineParser) => {
					log('---');
					log(parser.getName());

					var res = parser.match(text, offset, cursor);
					if (res) {
						log('-> match!');
						//console.log(res);
						memo.push(res);

						//we could break after first?
					}
					return memo;
				}, []);

				log('---');

				log('choices ' + choice.length);

				if (choice.length == 0) {
					//console.log('cannot match line');
					possibles = [];
				}
				else if (choice.length == 1) {
					log('single match line');
					log(choice[0].parser.id);
					//console.log(choice[0].match);

					res.push(choice[0]);
					possibles = choice[0].parser.next;
					log('switching possibles: [' + this.listIds(possibles) + ']');
				}
				else {
					log('multi match line');
					log(choice[0].parser.id);
					//console.log(choice[0].match);
					//TODO pick one!

					//why not first?
					res.push(choice[0]);
					possibles = choice[0].parser.next;
					log('switching possibles: [' + this.listIds(possibles) + ']');
				}

				if (possibles.length == 0) {
					log('no more possibles, break');
					break;
				}
			}
			log('--------------');

			log('total lineCount: ' + lineCount);
			log('procLineCount: ' + procLineCount);
			//console.log(util.inspect(res, false, 10));
			log('res.lengt: ' + res.length);

			if (res.length > 0) {
				_.each(res, (match:LineParserMatch) => {
					match.extract();
				});
			}
		}
	}

	export class LineParser {

		next:LineParser[] = [];

		//params: id, name of a matcher, callback to apply mater's data, optional list of following parsers
		constructor(public id:string, public exp:RegExp, public groupsMin:number, public callback:(match:LineParserMatch) => void, public nextIds:string[] = []) {
		}

		match(str:string, offset:number, limit:number):LineParserMatch {
			this.exp.lastIndex = offset;
			var match:RegExpExecArray = this.exp.exec(str);
			if (!match || match.length < 1) {
				return null;
			}
			//move this to constructor?
			if (this.groupsMin >= 0 && match.length < this.groupsMin) {
				throw(new Error(this.getName() + 'bad extract expected ' + this.groupsMin + ' groups, got ' + (this.match.length - 1)));
			}
			return new LineParserMatch(this, match);
		}

		getName():string {
			return this.id;
		}
	}
	//single match
	export class LineParserMatch {

		constructor(public parser:LineParser, public match:RegExpExecArray) {
		}

		extract():void {
			//hoop hoop!
			if (this.parser.callback) {
				this.parser.callback(this);
			}
		}

		getGroup(num:number, alt?:string = ''):string {
			//validate for sanity
			if (num >= this.match.length - 1) {
				throw(new Error(this.parser.getName() + ' group index ' + num + ' > ' + (this.match.length - 2)));
			}
			if (this.parser.groupsMin >= 0 && num >= this.parser.groupsMin) {
				throw(new Error(this.getName() + ' group index ' + num + ' >= parser.groupsMin ' + (this.parser.groupsMin)));
			}
			num += 1;
			if (num < 1 || num > this.match.length) {
				return '';
			}

			return this.match[num];
		}

		getGroupFloat(num:number, alt?:number = 0):number {
			var value = parseFloat(this.getGroup(num));
			if (isNaN(value)) {
				return alt;
			}
			return value;
		}

		getName():string {
			return this.parser.getName();
		}
	}
}