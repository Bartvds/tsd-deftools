///<reference path="../_ref.ts" />

module tsdimport {

	export class Repos {
		constructor(public url:string = '', public local:string = '') {
			//kill trailing  slash
			this.url = this.url.replace(/\/$/, '');
			this.local = this.local.replace(/\/$/, '');
		}
	}

	export class HeaderData {
		name:string = '';
		version:string = '*';
		description:string = '';
		projectUrl:string = '';
		authorName:string = '';
		authorUrl:string = '';
		reposName:string = '';
		reposUrl:string = '';
	}

	export class HeaderParser {

		nameVersion:RegExp;
		project:RegExp;
		creatorUrl:RegExp;
		repos:RegExp;

		constructor() {
			this.nameVersion = /\/\/[ \t]*Type definitions[\w ]+:?[ \t]+([\w\._\-]+)[ \t]+(\d+\.\d+\.?\d*)[ \t]*/;
			this.project = /\/\/[ \t]*Project:[ \t]+([\S]*)/;

			//add flexible URL delimited <http:/dfsf.sd>

			//[<\[\{\(] [\)\}\]>]

			this.creatorUrl = /\/\/[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?/;
			this.repos = /\/\/[ \t]*[\t\w+_-]+:[ \t]*[<[\{\(]?(http[\w:\/\\\._-]+)/;

		}

		parse(str:string):HeaderData {
			var i = str.indexOf('//');
			var len = str.length;
			if (i < 0) {
				return null;
			}
			var data = new HeaderData();

			this.nameVersion.lastIndex = i;
			this.project.lastIndex = i;
			this.creatorUrl.lastIndex = i;
			this.repos.lastIndex = i;

			//replace(/\/$/, '')

			var match;
			match = this.nameVersion.exec(str);

			console.log([match]);

			return data;
		}
	}

	export interface DataEncoder {
		write(str:HeaderData):string;
	}

	export class EncodeJSON_V2 implements DataEncoder {

		constructor() {

		}

		write(header:HeaderData):string {
			var ret = {
				"name": header.name,
				"description": header.description,
				"versions": [
					{
						"version": header.version,
						"key": getGUID(),
						"dependencies": [
							/*{
								"name": "LIB_NAME",
								"version": "VERSION"
							}*/
						],
						"url": header.reposUrl + '/' + header.name + '/' + header.name + '.d.ts',
						"author": header.authorUrl,
						"author_url": header.authorUrl
					}
				]
			};
			return JSON.stringify(ret);
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