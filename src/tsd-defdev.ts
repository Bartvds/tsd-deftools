///<reference path="_ref.ts" />
///<reference path="core/api.ts" />
///<reference path="core/lib.ts" />
///<reference path="core/config.ts" />
///<reference path="core/expose.ts" />

module tsdimport {

	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	var async:Async = require('async');
	var _:UnderscoreStatic = require('underscore');
	//var agent:SuperAgent = require('superagent');

	var info = Config.getInfo();
	var paths = Config.getPaths();
	var app:AppAPI = new AppAPI(info, new Repos(paths.DefinitelyTyped, paths.tsd, paths.tmp));


	console.log('tessst');
}
