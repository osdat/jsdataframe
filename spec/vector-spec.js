
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('vector methods:', function() {
  "use strict";

  describe('general:', function() {

    describe('vector.size', function() {
      it('returns the length of the vector', function() {
        expect(jd.seq(5).size()).toBe(5);
        expect(jd.vector([1]).size()).toBe(1);
        expect(jd.vector([]).size()).toBe(0);
      });
    });
  });

  describe('conversion:', function() {

    describe('vector.toArray', function() {
      it('returns an array copy of the vector\'s values', function() {
        var vector = jd.seq(3);
        var array = vector.toArray();

        expect(Array.isArray(array)).toBe(true);
        expect(vector.values).toEqual(array);

        // Changing the array does not affect the original vector
        array[0] = array[1] = array[2] = -1;
        expect(array).toEqual([-1, -1, -1]);
        expect(vector.values).toEqual([0, 1, 2]);
      });
    });

    describe('vector.toDtype', function() {
      it('coerces all elements to the requested dtype', function() {
        var vector = jd.vector([0, 1, 2, NaN]).toDtype('string');
        expect(vector.dtype).toBe('string');
        expect(vector.values).toEqual(['0', '1', '2', null]);
      });

      it('returns the original vector if the dtype already matches',
        function() {
          var origVector = jd.seq(3);
          var newVector = origVector.toDtype('number');
          expect(newVector === origVector).toBe(true);
        }
      );

      it('throws an error when given an invalid dtype', function() {
        expect(function() {
          jd.seq(3).toDtype('invalid');
        }).toThrowError(/dtype/);
      });

      it('normalizes the missing value type for dtypes that aren\'t "object"',
        function() {
          var objVec = jd.vector([undefined, null]);
          expect(objVec.values).toEqual([undefined, null]);
          expect(objVec.toDtype('boolean').values).toEqual([null, null]);
        }
      );
    });
  });

  describe('comparison:', function() {
    // TODO
  });

});
