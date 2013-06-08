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

		it('stores data by name', () => {
			map.set('aa', 'valueA');
			map.set('bb__bb', 100);
			assert.strictEqual(map.get('aa'),'valueA');
			assert.strictEqual(map.get('bb__bb'), 100);
		});

		it('lists correct keys', () => {
			var keys = map.keys();
		  assert.lengthOf(keys, 2);
			assert.include(keys, 'aa');
			assert.include(keys, 'bb__bb');
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
		});

		it('has updated keys after remove', () => {
			assert.include(map.keys(), 'aa');
			assert.notInclude(map.keys(), 'bb__bb');
		});

		it('returns alt value for removed data', () => {
			assert.strictEqual(map.get('bb__bb', 123), 123);
		});
	});
});