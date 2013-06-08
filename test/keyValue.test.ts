///<reference path="_ref.ts" />
///<reference path="../src/xm/keyValue.ts" />

declare var assert:chai.Assert;

describe('xm.KeyValueMap', () => {

	var map:xm.KeyValueMap;

	it('is defined', () => {
		assert.ok(xm.KeyValueMap);
	});
	it('is a constructor', () => {
		assert.ok(new (xm.KeyValueMap)());
	});

	describe('default', () => {
		before(() => {
			map = new xm.KeyValueMap();
		});
		after(() => {
			map = null;
		});

		it('is instanced', () => {
			assert.ok(map);
		});
		it('returns undefined for unset data', () => {
			assert.ok(!map.get(null));
			assert.ok(!map.get(''));
			assert.ok(!map.get('xyz'));
		});
		it('returns alt value for unset data', () => {
			assert.strictEqual(map.get('xyz', 'abc'), 'abc');
			assert.strictEqual(map.get('xyz', 123), 123);
			assert.strictEqual(map.get('xyz', false), false);
			assert.strictEqual(map.get('xyz', true), true);
		});

		describe('with data', () => {
			it('stores by name', () => {
				map.set('aa', 'valueA');
				map.set('bb__bb', 100);
				assert.strictEqual(map.get('aa'), 'valueA');
				assert.strictEqual(map.get('bb__bb'), 100);
			});
			it('lists correct keys', () => {
				assert.sameMembers(map.keys(), ['aa', 'bb__bb']);
			});
			it('overrides data by name', () => {
				map.set('aa', 200);
				assert.strictEqual(map.get('aa'), 200);
				map.set('aa', 'valueA');
				assert.strictEqual(map.get('aa'), 'valueA');
			});
			it('removes data by name', () => {
				map.remove('bb__bb');
				assert.ok(!map.get('bb__bb'));
				assert.strictEqual(map.get('bb__bb', 123), 123);
				assert.sameMembers(map.keys(), ['aa']);
			});

			it('has updated keys after remove', () => {
				assert.include(map.keys(), 'aa');
				assert.notInclude(map.keys(), 'bb__bb');
			});
			it('returns alt value for removed data', () => {
				assert.strictEqual(map.get('bb__bb', 123), 123);
			});
		});

		describe('import', () => {

			var data;

			before(() => {
				data = {aa: 'valueAAA', 'bb__bb': 321};
			});
			after(() => {
				data = null;
			});

			it('from object', () => {
				map = new xm.KeyValueMap();
				map.import(data);

				assert.strictEqual(map.get('aa'), 'valueAAA');
				assert.strictEqual(map.get('bb__bb'), 321);
				assert.sameMembers(map.keys(), ['aa', 'bb__bb']);
			});
			it('ignore non-object object', () => {
				map = new xm.KeyValueMap();
				map.import(null);
				assert.lengthOf(map.keys(), 0);
			});
			it('constructor param', () => {
				map = new xm.KeyValueMap(data);

				assert.strictEqual(map.get('aa'), 'valueAAA');
				assert.strictEqual(map.get('bb__bb'), 321);
				assert.sameMembers(map.keys(), ['aa', 'bb__bb']);
			});
		});
	});
});