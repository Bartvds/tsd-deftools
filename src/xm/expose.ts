///<reference path="../_ref.ts" />

module xm {

	var _:UnderscoreStatic = require('underscore');

	export class Expose {

		private _commands:any = {};

		constructor() {
			this.add('help', () => {
				console.log('-> available commands:');
				_.keys(this._commands).sort().forEach((value) => {
					console.log('  ' + value);
				});
			});
			this.map('h', 'help');
		}

		executeArgv(argv:any, alt?:string) {
			if (!argv || argv._.length == 0) {
				if (alt && this.has(alt)) {
					this.execute(alt);
				}
				this.execute('help');
			}
			else {
				if (this.has(argv._[0])) {
					this.execute(argv._[0], argv);
				}
				else {
					console.log('command not found: '+argv._[0]);
					this.execute('help');
				}
			}
		}
		execute(id:string, args:any=null, head:bool = true) {
			if (!this._commands.hasOwnProperty(id)) {
				console.log('\n-> unknown command ' + id + '\n');
				return;
			}
			if (head) {
				console.log('\n-> ' + id+ '\n');
			}
			var f = this._commands[id];
			f.call(null, args);
		}

		add(id:string, def:(args:any) => void) {
			if (this._commands.hasOwnProperty(id)) {
				throw new Error('id collision on ' + id);
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