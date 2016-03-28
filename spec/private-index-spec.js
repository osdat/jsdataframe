
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('private index types:', function() {
  "use strict";

  describe('nested index:', function() {
    var newNestedIndex = jd._private_export.newNestedIndex;

    var vec1 = jd.vector([2, NaN, 0, 2, 2, NaN, 1, 1,   NaN, NaN]);
    var vec2 = jd.vector([2, NaN, 0, 2, 1, 1,   1, NaN, NaN, NaN])
      .toDtype('date');
    var vec3 = jd.vector([2, NaN, 0, 2, 1, 1,   1, NaN, NaN, NaN])
      .toDtype('string');

    describe('single vector example', function() {
      var initVectors = [vec1];

      it('constructed with newNestedIndex', function() {
        var nestedIndex = newNestedIndex(initVectors);
        expect(nestedIndex.initVectors).toBe(initVectors);
        expect(nestedIndex.size).toBe(4);
      });

      it('lookup behaves as expected', function() {
        var nestedIndex = newNestedIndex(initVectors);
        var lookupKeys = [jd.vector([0, 1, 2, NaN, 5])];
        expect(nestedIndex.lookup(lookupKeys, 0)).toBe(2);
        expect(nestedIndex.lookup(lookupKeys, 1)).toEqual([6, 7]);
        expect(nestedIndex.lookup(lookupKeys, 2)).toEqual([0, 3, 4]);
        expect(nestedIndex.lookup(lookupKeys, 3)).toEqual([1, 5, 8, 9]);
        expect(nestedIndex.lookup(lookupKeys, 4)).toBe(null);

        var nestedIndex2 = newNestedIndex([vec2]);
        var lookupKeys2 = [jd.vector([0, 1, 2, NaN, 5]).toDtype('date')];
        expect(nestedIndex2.lookup(lookupKeys2, 0)).toBe(2);
        expect(nestedIndex2.lookup(lookupKeys2, 1)).toEqual([4, 5, 6]);
        expect(nestedIndex2.lookup(lookupKeys2, 2)).toEqual([0, 3]);
        expect(nestedIndex2.lookup(lookupKeys2, 3)).toEqual([1, 7, 8, 9]);
        expect(nestedIndex2.lookup(lookupKeys2, 4)).toBe(null);
      });
    });

    describe('multiple vector example', function() {
      var initVectors = [vec1, vec2, vec3];

      it('constructed with newNestedIndex', function() {
        var nestedIndex = newNestedIndex(initVectors);
        expect(nestedIndex.initVectors).toBe(initVectors);
        expect(nestedIndex.size).toBe(7);

        var nestedIndex2 = newNestedIndex([vec2, vec3]);
        expect(nestedIndex2.size).toBe(4);
      });

      it('lookup behaves as expected', function() {
        var nestedIndex = newNestedIndex(initVectors);
        var lookupKeys = [
          jd.vector([0, 1, 2, NaN, NaN, NaN, 5]),
          jd.vector([0, 1, 2, NaN, 1,   1,   5]).toDtype('date'),
          jd.vector([0, 1, 2, NaN, 1,   2,   5]).toDtype('string')
        ];

        expect(nestedIndex.lookup(lookupKeys, 0)).toBe(2);
        expect(nestedIndex.lookup(lookupKeys, 1)).toBe(6);
        expect(nestedIndex.lookup(lookupKeys, 2)).toEqual([0, 3]);
        expect(nestedIndex.lookup(lookupKeys, 3)).toEqual([1, 8, 9]);
        expect(nestedIndex.lookup(lookupKeys, 4)).toBe(5);
        expect(nestedIndex.lookup(lookupKeys, 5)).toBe(null);
        expect(nestedIndex.lookup(lookupKeys, 6)).toBe(null);
      });
    });
  });
});
