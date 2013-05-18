///<reference path="_ref.ts" />

module tsdimport {

	//var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');

	export class Expose {

		_commands:any = {};

		constructor() {
			this.add('help', () => {
				console.log('availible commands:');
				_(this._commands).keys().sort().forEach((value) => {
					console.log('  - ' + value);
				});
			});
			this.map('h', 'help');
		}

		execute(id:string, head:bool = true) {
			if (!this._commands.hasOwnProperty(id)) {
				console.log('-> unknown command ' + id);
				return;
			}
			if (head) {
				console.log('-> ' + id);
			}
			var f = this._commands[id];
			f.call(null);
		}

		add(id:string, def:Function) {
			if (this._commands.hasOwnProperty(id)) {
				throw new Error('id collission on ' + id);
			}
			this._commands[id] = def;
		}

		has(id:string) {
			return this._commands.hasOwnProperty(id);
		}

		map(id:string, to:string) {
			var self = this;
			this.add(id, () => {
				self.execute(to, false);
			});
		}
	}
}