///<reference path="_ref.ts" />
///<reference path="../src/xm/regexp.ts" />

declare var assert:chai.Assert;
declare var _:UnderscoreStatic;

class ClassTS {
	aa:string = 'hello';
	bb:number = 1;
	cc:number[] = [1, 2, 3];
	dd:any = {a: 1, b: 2};
}
var NamedJS = function NamedJS() {
	this.aa = 'hello';
	this.bb = 1;
	this.cc = [1, 2, 3];
	this.dd = {a: 1, b: 2};
}
var AnonJS = function AnonJS() {
	this.aa = 'hello';
	this.bb = 1;
	this.cc = [1, 2, 3];
	this.dd = {a: 1, b: 2};
};
var getLiteral = function () {
	return {
		aa: 'hello',
		bb: 1,
		cc: [1, 2, 3],
		dd: {a: 1, b: 2}
	};
};
var modifyObj = (obj, level, value) => {
	if (level === 1) {
		obj.bb = value;
	}
	else if (level === 2) {
		obj.dd.c = value;
	}
	return obj;
};
var typeFactoryMap = {
	literal: (change) => {
		return modifyObj(getLiteral(), change, 'literal');
	},
	created: (change) => {
		return  modifyObj(Object.create(getLiteral()), change, 'created');
	},
	namedJS: (change) => {
		return modifyObj(new NamedJS(), change, 'namedJS');
	},
	anonnJS: (change) => {
		return modifyObj(new AnonJS(), change, 'anonnJS');
	},
	classTS: (change) => {
		return modifyObj(new ClassTS(), change, 'classTS');
	}
};

describe('chai', () => {
	describe('should assert deepEqual', () => {
		_.each(typeFactoryMap, (left, name, map) => {
			it(name, () => {
				var obj = left();
				_.each(map, (right, name) => {
					assert.deepEqual(obj, right(), name);
				});
			});
		});
	});
	describe('should assert notDeepEqual', () => {
		_.each(typeFactoryMap, (left, name, map) => {
			it(name, () => {
				var obj = left();
				_.each(map, (right, name) => {
					assert.notDeepEqual(obj, right(), name);
				});
			});
		});
	});
});
