///<reference path="../_ref.ts" />

module tsdimport {

	var util = require('util');
	var _:UnderscoreStatic = require('underscore');

	export module helper {

		var expTrim = /^\/(.*)\/([a-z]+)*$/gm;
		var allowFlags = /[gixsm]/g;

		export class RegExGlue {

			parts:RegExp[] = [];

			constructor() {
			}

			add(...exp:RegExp[]):RegExGlue {
				console.log(exp);
				return this;
			}

			getBody(exp:RegExp):string {
				var trim = expTrim.exec(''+exp);
				if (!trim) {
					return '';
				}
				return typeof trim[1] !== 'undefined' ? trim[1] : '';
			}

			getFlags(exp:RegExp):string {
				var trim = expTrim.exec(''+exp);
				if (!trim) {
					return '';
				}
				return typeof trim[2] !== 'undefined' ? this.getCleanFlags(trim[2]) : '';
			}

			getCleanFlags(flags:String):string {
				return _.uniq(flags.match(allowFlags)).join('');
			}

			join(flags:string, glueExp?:RegExp):RegExp {
				var glueBody = this.getBody(glueExp);
				var chunks:string[] = [];

				flags = typeof flags !== 'undefined' ? this.getCleanFlags(flags) : '';

				_.each(this.parts, (exp:RegExp) => {
					var trim = expTrim.exec(''+exp);
					if (!trim) {
						return;
					}
					if (trim.length < 2) {
						console.log(trim);
						return;
					}
					chunks.push(trim[1]);
				});
				return new RegExp(chunks.join(glueBody), flags)
			}
		}
	}
}