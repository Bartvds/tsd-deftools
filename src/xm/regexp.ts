///<reference path="../_ref.ts" />

module xm {

	var expTrim = /^\/(.*)\/([a-z]+)*$/gm;
	var flagFilter = /[gim]/;
	//var flagFilter = /[gixsm]/;

	export class RegExpGlue {

		parts:string[] = [];

		constructor(...exp:RegExp[]) {
			if (exp.length > 0) {
				this.append.apply(this, exp);
			}
		}

		static get(...exp:RegExp[]):RegExpGlue {
			var e = new RegExpGlue();
			return e.append.apply(e, exp);
		}

		append(...exp:RegExp[]):RegExpGlue {
			exp.forEach((value:RegExp) => {
				this.parts.push('' + value);
			}, this);
			return this;
		}

		getBody(exp:RegExp):string {
			expTrim.lastIndex = 0;
			var trim = expTrim.exec('' + exp);
			if (!trim) {
				return '';
			}
			return typeof trim[1] !== 'undefined' ? trim[1] : '';
		}

		getFlags(exp:RegExp):string {
			expTrim.lastIndex = 0;
			var trim = expTrim.exec('' + exp);
			if (!trim) {
				return '';
			}
			return typeof trim[2] !== 'undefined' ? this.getCleanFlags(trim[2]) : '';
		}

		getCleanFlags(flags:String):string {
			var ret = '';
			for (var i = 0; i < flags.length; i++) {
				var char = flags.charAt(i);
				if (flagFilter.test(char) && ret.indexOf(char) < 0) {
					ret += char;
				}
			}
			return ret;
		}

		join(flags?:string, seperator?:RegExp):RegExp {
			//console.log('join flags: ' + flags + ' seperator: ' + seperator);
			//console.log(this.parts);
			var glueBody = seperator ? this.getBody(seperator) : '';
			var chunks:string[] = [];
			//console.log(glueBody);

			flags = typeof flags !== 'undefined' ? this.getCleanFlags(flags) : '';

			this.parts.forEach((exp, index, arr) => {
				expTrim.lastIndex = 0;
				var trim = expTrim.exec('' + exp);
				//console.log('loppp ' + exp);
				//console.log(trim);
				if (!trim) {
					return;
				}
				if (trim.length < 2) {
					console.log(trim);
					return;
				}
				chunks.push(trim[1]);
			}, this);
			return new RegExp(chunks.join(glueBody), flags)
		}
	}
}