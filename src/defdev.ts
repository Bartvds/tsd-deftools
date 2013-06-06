///<reference path="_ref.ts" />
///<reference path="deftools/api.ts" />
///<reference path="deftools/lib.ts" />
///<reference path="deftools/config.ts" />

module deftools {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var api:API = new API(info, new Repos(paths.typings, paths.tsd, paths.tmp));

}
