var tsdimport;
(function (tsdimport) {
    var path = require('path');
    var fs = require('fs');
    var trailSlash = /(\w)(\/?)$/;
    var ToolInfo = (function () {
        function ToolInfo(name, version, pkg) {
            this.name = name;
            this.version = version;
            this.pkg = pkg;
            if(!this.name) {
                throw Error('no name');
            }
            if(!this.version) {
                throw Error('no version');
            }
            if(!this.pkg) {
                throw Error('no pkg');
            }
        }
        ToolInfo.prototype.getNameVersion = function () {
            return this.name + ' ' + this.version;
        };
        return ToolInfo;
    })();
    tsdimport.ToolInfo = ToolInfo;    
    var Repos = (function () {
        function Repos(defs, tsd, out) {
            this.defs = defs;
            this.tsd = tsd;
            this.out = out;
            if(!this.defs) {
                throw ('missing local');
            }
            if(!this.tsd) {
                throw ('missing tsd');
            }
            if(!this.out) {
                throw ('missing out');
            }
            this.defs = path.resolve(this.defs).replace(trailSlash, '$1/');
            this.tsd = path.resolve(this.tsd).replace(trailSlash, '$1/');
            this.out = path.resolve(this.out).replace(trailSlash, '$1/');
            if(!fs.existsSync(this.defs) || !fs.statSync(this.defs).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.defs);
            }
            if(!fs.existsSync(this.tsd) || !fs.statSync(this.tsd).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.tsd);
            }
            if(!fs.existsSync(this.out) || !fs.statSync(this.out).isDirectory()) {
                throw new Error('path not exist or not directoy: ' + this.out);
            }
        }
        return Repos;
    })();
    tsdimport.Repos = Repos;    
    var HeaderData = (function () {
        function HeaderData(def) {
            this.def = def;
            this.name = '';
            this.version = '*';
            this.submodule = '';
            this.description = '';
            this.projectUrl = '';
            this.authorName = '';
            this.authorUrl = '';
            this.reposName = '';
            this.reposUrl = '';
            this.errors = [];
            this.references = [];
            this.dependencies = [];
        }
        HeaderData.prototype.getDefUrl = function () {
            if(!this.def) {
                return '';
            }
            return this.reposUrl + this.def.project + '/' + this.def.name + '.d.ts';
        };
        HeaderData.prototype.isValid = function () {
            if(this.errors.length > 0) {
                return false;
            }
            if(!this.name || !this.version || !this.projectUrl) {
                return false;
            }
            if(!this.authorName || !this.authorUrl) {
                return false;
            }
            if(!this.reposName || !this.reposUrl) {
                return false;
            }
            return true;
        };
        return HeaderData;
    })();
    tsdimport.HeaderData = HeaderData;    
    function getGUID() {
        var S4 = function () {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    tsdimport.getGUID = getGUID;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var ExportResult = (function () {
        function ExportResult() {
            this.created = [];
        }
        return ExportResult;
    })();
    tsdimport.ExportResult = ExportResult;    
    var HeaderExport = (function () {
        function HeaderExport(header, path) {
            this.header = header;
            this.path = path;
        }
        return HeaderExport;
    })();
    tsdimport.HeaderExport = HeaderExport;    
    var DefinitionExporter = (function () {
        function DefinitionExporter(repos, info) {
            this.repos = repos;
            this.info = info;
        }
        DefinitionExporter.prototype.getEncoder = function () {
            return new Encode(this.repos, this.info);
        };
        DefinitionExporter.prototype.writeDef = function (data, encoder, finish) {
            var dest = this.repos.out + data.def.name + '.json';
            var exp = new HeaderExport(data, dest);
            fs.exists(dest, function (exists) {
                if(exists) {
                    return finish('file exists: ' + dest);
                }
                var obj = encoder.encode(data);
                fs.writeFile(dest, JSON.stringify(obj, null, 4), function (err) {
                    finish(err, exp);
                });
            });
        };
        DefinitionExporter.prototype.exportDefinitions = function (list, finish) {
            var self = this;
            var encoder = this.getEncoder();
            var res = new ExportResult();
            async.forEach(list, function (data, callback) {
                console.log('writeDef ' + data.name);
                self.writeDef(data, encoder, function (err, exp) {
                    if(err) {
                        return callback(err);
                    }
                    if(data) {
                        res.created.push(exp);
                    }
                    callback(null, exp);
                });
            }, function (err) {
                finish(err, res);
            });
        };
        return DefinitionExporter;
    })();
    tsdimport.DefinitionExporter = DefinitionExporter;    
    var Encode = (function () {
        function Encode(repos, info) {
            this.repos = repos;
            this.info = info;
        }
        Encode.prototype.encode = function (header) {
            var ret = {
                "name": header.def.name,
                "description": header.name + (header.submodule ? ' (' + header.submodule + ')' : '') + (header.submodule ? ' ' + header.submodule : ''),
                "generated": this.info.getNameVersion() + ' @ ' + new Date().toUTCString(),
                "versions": [
                    {
                        "version": header.version,
                        "key": tsdimport.getGUID(),
                        "dependencies": _.map(header.dependencies, function (data) {
                            return {
                                "name": data.name,
                                "version": data.version
                            };
                        }),
                        "url": header.getDefUrl(),
                        "author": header.authorName,
                        "author_url": header.authorUrl
                    }
                ]
            };
            return ret;
        };
        return Encode;
    })();
    tsdimport.Encode = Encode;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var HeaderParser = (function () {
        function HeaderParser() {
            this.nameVersion = /^[ \t]*\/\/\/?[ \t]*Type definitions[ \t]*for?:?[ \t]+([\w\._ -]+)[ \t]+(\d+\.\d+\.?\d*\.?\d*)[ \t]*[<\[\{\(]?([\w \t_-]+)*[\)\}\]>]?[ \t]*$/gm;
            this.labelUrl = /^[ \t]*\/\/\/?[ \t]*([\w _-]+):?[ \t]+[<\[\{\(]?(http[\S]*)[ \t]*$/gm;
            this.authorNameUrl = /^[ \t]*\/\/\/?[ \t]*Definitions[ \t\w]+:[ \t]+([\w \t]+[\w]+)[ \t]*[<\[\{\(]?(http[\w:\/\\\._-]+)[\)\}\]>]?[ \t]*$/gm;
            this.referencePath = /^[ \t]*\/\/\/\/?[ \t]*<reference[ \t]*path=["']?([\w\.\/_-]*)["']?[ \t]*\/>[ \t]*$/gm;
            this.endSlash = /\/?$/;
        }
        HeaderParser.prototype.parse = function (def, str) {
            if(typeof str !== 'string') {
                str = '' + str;
            }
            var i = str.indexOf('//');
            var len = str.length;
            if(i < 0) {
                return null;
            }
            var data = new tsdimport.HeaderData(def);
            this.nameVersion.lastIndex = i;
            this.labelUrl.lastIndex = i;
            this.authorNameUrl.lastIndex = i;
            var err = [];
            var match;
            match = this.nameVersion.exec(str);
            if(!match || match.length < 3) {
                data.errors.push('unparsable name/version line');
            } else {
                data.name = match[1];
                data.version = match[2];
                data.submodule = match.length >= 3 && match[3] ? match[3] : '';
                this.labelUrl.lastIndex = match.index + match[0].length;
            }
            match = this.labelUrl.exec(str);
            if(!match || match.length < 2) {
                data.errors.push('unparsable project line');
            } else {
                data.projectUrl = match[2];
                this.authorNameUrl.lastIndex = match.index + match[0].length;
            }
            match = this.authorNameUrl.exec(str);
            if(!match || match.length < 3) {
                data.errors.push('unparsable author line');
            } else {
                data.authorName = match[1];
                data.authorUrl = match[2];
                this.labelUrl.lastIndex = match.index + match[0].length;
            }
            match = this.labelUrl.exec(str);
            if(!match || match.length < 3) {
                data.errors.push('unparsable repos line');
            } else {
                data.reposUrl = match[2].replace(this.endSlash, '/');
            }
            this.referencePath.lastIndex = 0;
            while(match = this.referencePath.exec(str)) {
                if(match.length > 1) {
                    data.references.push(match[1]);
                }
            }
            return data;
        };
        return HeaderParser;
    })();
    tsdimport.HeaderParser = HeaderParser;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var dependency = /^\.\.\/([\w _-]+)\/([\w _-]+)\.d\.ts$/;
    var definition = /^([\w _-]+)\.d\.ts$/;
    var ImportResult = (function () {
        function ImportResult() {
            this.error = [];
            this.parsed = [];
            this.map = {
            };
        }
        return ImportResult;
    })();
    tsdimport.ImportResult = ImportResult;    
    var DefinitionImporter = (function () {
        function DefinitionImporter(repos) {
            this.repos = repos;
        }
        DefinitionImporter.prototype.loadDef = function (def, res, callback) {
            var src = path.resolve(this.repos.defs + def.project + '/' + def.name + '.d.ts');
            var self = this;
            var key = def.combi();
            if(res.map.hasOwnProperty(key)) {
                console.log('from cache: ' + key);
                return callback(null, res.map[key]);
            }
            fs.readFile(src, 'utf-8', function (err, source) {
                if(err) {
                    return callback(err);
                }
                var parser = new tsdimport.HeaderParser();
                var data = parser.parse(def, source);
                if(!data) {
                    return callback([
                        key, 
                        'bad data'
                    ]);
                }
                if(data.errors.length > 0) {
                    return callback([
                        def, 
                        src, 
                        data.errors
                    ]);
                }
                if(!data.isValid()) {
                    return callback([
                        def, 
                        'invalid data'
                    ]);
                }
                if(data) {
                    res.map[key] = data;
                }
                return callback(null, data);
            });
        };
        DefinitionImporter.prototype.parseDefinitions = function (projects, finish) {
            var self = this;
            var res = new ImportResult();
            async.forEach(projects, function (def, callback) {
                self.loadDef(def, res, function (err, data) {
                    if(err) {
                        res.error.push(err);
                        return callback(null);
                    }
                    if(!data) {
                        res.error.push('no data');
                        return callback('null data');
                    }
                    res.parsed.push(data);
                    if(data.references.length > 0) {
                        async.forEach(data.references, function (ref, callback) {
                            var match, dep;
                            match = ref.match(dependency);
                            if(match && match.length >= 3) {
                                dep = new tsdimport.Def(match[1], match[2]);
                            } else {
                                match = ref.match(definition);
                                if(match && match.length >= 2) {
                                    dep = new tsdimport.Def(def.project, match[1]);
                                }
                            }
                            if(dep) {
                                self.loadDef(dep, res, function (err, sub) {
                                    if(err) {
                                        res.error.push(err);
                                        return callback(null);
                                    }
                                    if(!sub) {
                                        res.error.push([
                                            'cannot load dependency', 
                                            ref
                                        ]);
                                        return callback(null);
                                    }
                                    data.dependencies.push(sub);
                                    return callback(null, data);
                                });
                                return;
                            }
                            return callback([
                                'bad reference', 
                                def.project, 
                                def.name, 
                                ref
                            ]);
                        }, function (err) {
                            callback(err);
                        });
                    } else {
                        callback(null, data);
                    }
                });
            }, function (err) {
                if(err) {
                    console.log('err ' + err);
                    return finish(err);
                }
                finish(null, res);
            });
        };
        return DefinitionImporter;
    })();
    tsdimport.DefinitionImporter = DefinitionImporter;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var stripExt = /(\.[\w_-]+)$/;
    var ignoreFile = /^[\._]/;
    var isJson = /\.json$/;
    var isDef = /\.d\.ts$/;
    (function (loader) {
        function loadRepoDefList(repos, finish) {
            fs.readdir(repos.defs, function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                var ret = [];
                async.forEach(files, function (file, callback) {
                    if(ignoreFile.test(file)) {
                        return callback(false);
                    }
                    var src = path.join(repos.defs, file);
                    fs.stat(src, function (err, stats) {
                        if(err) {
                            return callback(false);
                        }
                        if(!stats.isDirectory()) {
                            return callback(false);
                        }
                        fs.readdir(src, function (err, files) {
                            if(err) {
                                return callback(false);
                            }
                            files = _(files).filter(function (name) {
                                return isDef.test(name);
                            });
                            async.forEach(files, function (name, callback) {
                                var tmp = path.join(src, name);
                                fs.stat(tmp, function (err, stats) {
                                    if(err) {
                                        return callback(false);
                                    }
                                    if(stats.isDirectory()) {
                                        return callback(false);
                                    }
                                    ret.push(new tsdimport.Def(file, name.replace(isDef, '')));
                                    callback(null);
                                });
                            }, function (err) {
                                callback(err);
                            });
                        });
                    });
                }, function (err) {
                    finish(err, ret);
                });
            });
        }
        loader.loadRepoDefList = loadRepoDefList;
        function loadTsdList(repos, finish) {
            fs.readdir(repos.tsd + 'repo_data', function (err, files) {
                if(err) {
                    return finish(err, []);
                }
                finish(null, _(files).filter(function (value) {
                    return !ignoreFile.test(value) && isJson.test(value);
                }).map(function (value) {
                    return value.replace(stripExt, '');
                }));
            });
        }
        loader.loadTsdList = loadTsdList;
    })(tsdimport.loader || (tsdimport.loader = {}));
    var loader = tsdimport.loader;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var Def = (function () {
        function Def(project, name) {
            this.project = project;
            this.name = name;
        }
        Def.prototype.combi = function () {
            return this.project + '/' + this.name;
        };
        return Def;
    })();
    tsdimport.Def = Def;    
    function getDupes(arr) {
        var uni = _.unique(arr);
        arr = _.filter(arr, function (value) {
            var i = uni.indexOf(value);
            if(i > -1) {
                uni.splice(i, 1);
                return false;
            }
            return true;
        });
        return arr;
    }
    tsdimport.getDupes = getDupes;
    function getDefCollide(arr) {
        var map = _.reduce(arr, function (memo, def) {
            if(!memo.hasOwnProperty(def.name)) {
                memo[def.name] = [
                    def
                ];
            } else {
                memo[def.name].push(def);
            }
            return memo;
        }, {
        });
        var ret = {
        };
        _.each(map, function (value, key) {
            if(value.length > 1) {
                ret[key] = value;
            }
        });
        return ret;
    }
    tsdimport.getDefCollide = getDefCollide;
    var CompareResult = (function () {
        function CompareResult() {
            this.repoAll = [];
            this.repoUnlisted = [];
            this.tsdAll = [];
            this.tsdNotInRepo = [];
            this.repoAllDupes = {
            };
            this.repoUnlistedDupes = {
            };
        }
        CompareResult.prototype.repoAllNames = function () {
            return _.map(this.repoAll, function (value) {
                return value.name;
            });
        };
        CompareResult.prototype.repoUnlistedNames = function () {
            return _.map(this.repoUnlisted, function (value) {
                return value.name;
            });
        };
        CompareResult.prototype.getStats = function () {
            return new CompareStats(this);
        };
        return CompareResult;
    })();
    tsdimport.CompareResult = CompareResult;    
    var CompareStats = (function () {
        function CompareStats(res) {
            this.res = res;
            this.repoAll = 0;
            this.repoUnlisted = 0;
            this.tsdAll = 0;
            this.tsdNotInRepo = 0;
            this.repoAllDupes = 0;
            this.repoUnlistedDupes = 0;
            this.update();
            Object.defineProperty(this, "res", {
                enumerable: false
            });
        }
        CompareStats.prototype.update = function () {
            this.repoAll = this.res.repoAll.length;
            this.repoUnlisted = this.res.repoUnlisted.length;
            this.tsdAll = this.res.tsdAll.length;
            this.tsdNotInRepo = this.res.tsdAll.length;
            this.repoAllDupes = _(this.res.repoAllDupes).size();
            this.repoUnlistedDupes = _(this.res.repoUnlistedDupes).size();
        };
        return CompareStats;
    })();
    tsdimport.CompareStats = CompareStats;    
    var DefinitionComparer = (function () {
        function DefinitionComparer(repos) {
            this.repos = repos;
        }
        DefinitionComparer.prototype.compare = function (finish) {
            var self = this;
            async.parallel({
                defs: function (callback) {
                    tsdimport.loader.loadRepoDefList(self.repos, callback);
                },
                tsd: function (callback) {
                    tsdimport.loader.loadTsdList(self.repos, callback);
                }
            }, function (err, results) {
                var res = new CompareResult();
                res.tsdAll = results.tsd;
                res.repoAll = results.defs;
                res.repoAllDupes = getDefCollide(res.repoAll);
                if(_(res.repoAllDupes).keys().length > 0) {
                    console.log('name collisions in repo');
                }
                res.repoUnlisted = _(res.repoAll).filter(function (value) {
                    return !_(results.tsd).some(function (t) {
                        return value.name == t;
                    });
                });
                res.tsdNotInRepo = _(res.tsdAll).filter(function (value) {
                    return !_(res.repoAll).some(function (def) {
                        return def.name == value;
                    });
                });
                res.repoAllDupes = getDefCollide(res.repoAll);
                res.repoUnlistedDupes = getDefCollide(res.repoUnlisted);
                finish(err, res);
            });
        };
        return DefinitionComparer;
    })();
    tsdimport.DefinitionComparer = DefinitionComparer;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var AppAPI = (function () {
        function AppAPI(info, repos) {
            this.info = info;
            this.repos = repos;
            if(!this.info) {
                throw Error('no info');
            }
            if(!this.repos) {
                throw Error('no repos');
            }
        }
        AppAPI.prototype.compare = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            comparer.compare(function (err, res) {
                if(err) {
                    callback(err);
                }
                callback(null, res);
            });
        };
        AppAPI.prototype.createUnlisted = function (callback) {
            var comparer = new tsdimport.DefinitionComparer(this.repos);
            var importer = new tsdimport.DefinitionImporter(this.repos);
            var exporter = new tsdimport.DefinitionExporter(this.repos, this.info);
            async.waterfall([
                function (callback) {
                    comparer.compare(callback);
                }, 
                function (res, callback) {
                    importer.parseDefinitions(res.repoAll, callback);
                }, 
                function (res, callback) {
                    console.log('error: ' + res.error.length);
                    console.log('parsed: ' + res.parsed.length);
                    exporter.exportDefinitions(res.parsed, callback);
                }            ], function (err, res) {
                callback(err, res);
            });
        };
        AppAPI.prototype.parseCurrent = function (callback) {
        };
        return AppAPI;
    })();
    tsdimport.AppAPI = AppAPI;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    (function (Config) {
        var paths;
        var info;
        function getPaths() {
            if(paths) {
                return paths;
            }
            var tmp = path.resolve('./tsd-deftools-path.json');
            try  {
                paths = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
            } catch (e) {
                throw (e);
            }
            if(!fs.existsSync(paths.tmp)) {
                fs.mkdir(paths.tmp);
            }
            return paths;
        }
        Config.getPaths = getPaths;
        function getInfo() {
            if(info) {
                return info;
            }
            var pkg;
            try  {
                pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
            } catch (e) {
                throw (e);
            }
            return info = new tsdimport.ToolInfo(pkg.name, pkg.version, pkg);
        }
        Config.getInfo = getInfo;
    })(tsdimport.Config || (tsdimport.Config = {}));
    var Config = tsdimport.Config;
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var Expose = (function () {
        function Expose() {
            var _this = this;
            this._commands = {
            };
            this.add('help', function () {
                console.log('availible commands:');
                _(_this._commands).keys().sort().forEach(function (value) {
                    console.log('  - ' + value);
                });
            });
            this.map('h', 'help');
        }
        Expose.prototype.execute = function (id, head) {
            if (typeof head === "undefined") { head = true; }
            if(!this._commands.hasOwnProperty(id)) {
                console.log('-> unknown command ' + id);
                return;
            }
            if(head) {
                console.log('-> ' + id);
            }
            var f = this._commands[id];
            f.call(null);
        };
        Expose.prototype.add = function (id, def) {
            if(this._commands.hasOwnProperty(id)) {
                throw new Error('id collission on ' + id);
            }
            this._commands[id] = def;
        };
        Expose.prototype.has = function (id) {
            return this._commands.hasOwnProperty(id);
        };
        Expose.prototype.map = function (id, to) {
            var self = this;
            this.add(id, function () {
                self.execute(to, false);
            });
        };
        return Expose;
    })();
    tsdimport.Expose = Expose;    
})(tsdimport || (tsdimport = {}));
var tsdimport;
(function (tsdimport) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var async = require('async');
    var _ = require('underscore');
    var info = tsdimport.Config.getInfo();
    var paths = tsdimport.Config.getPaths();
    var app = new tsdimport.AppAPI(info, new tsdimport.Repos(paths.DefinitelyTyped, paths.tsd, paths.tmp));
    var expose = new tsdimport.Expose();
    expose.add('info', function () {
        console.log(info.getNameVersion());
        _(app.repos).keys().sort().forEach(function (value) {
            console.log('   ' + value + ': ' + app.repos[value]);
        });
    });
    expose.add('compare', function () {
        app.compare(function (err, res) {
            if(err) {
                return console.log(err);
            }
            console.log(res);
            console.log(res.getStats());
        });
    });
    var argv = require('optimist').argv;
    expose.execute('info');
    if(argv._.length == 0) {
        expose.execute('help');
    } else {
        expose.execute(argv._[0]);
        if(!expose.has(argv._[0])) {
            expose.execute('help');
        }
    }
})(tsdimport || (tsdimport = {}));
