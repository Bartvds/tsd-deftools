///<reference path="../_ref.ts" />
///<reference path="lib.ts" />

module tsdimport {


	export interface DataEncoder {
		encode(str:HeaderData):any;
	}

	export class Encode_V2 implements DataEncoder {
		constructor() {

		}

		encode(header:HeaderData):any {
			var ret = {
				"name": header.name,
				"description": header.description,
				"versions": [
					{
						"version": header.version,
						"key": getGUID(),
						"dependencies": _.map(header.dependencies, (data:HeaderData) => {
							return {
								"name": data.name,
								"version": data.version
							}
						}),
						"url": header.reposUrl + header.name.toLowerCase() + '/' + header.name.toLowerCase() + '.d.ts',
						"author": header.authorName,
						"author_url": header.authorUrl
					}
				]
			};
			return ret;
		}
	}

	export function getGUID():string {
		var S4 = function () {
			return Math.floor(
			Math.random() * 0x10000 /* 65536 */
			).toString(16);
		};

		return (
			S4() + S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + S4() + S4()
		);
	}
}