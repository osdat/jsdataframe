
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

  describe('missing values:', function() {
    var exampleVector = jd.vector([NaN, 1, NaN, 2, 3, NaN]);

    describe('isNa', function() {
      it('behaves as expected', function() {
        var vector = exampleVector.isNa();
        expect(vector.dtype).toBe('boolean');
        expect(vector.values).toEqual([true, false, true, false, false, true]);

        var vector2 = jd.vector([]).isNa();
        expect(vector2.dtype).toBe('boolean');
        expect(vector2.values).toEqual([]);
      });
    });

    describe('dropNa', function() {
      it('remove missing values', function() {
        var vector = exampleVector.dropNa();
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([1, 2, 3]);

      });

      it('does not alter vectors with no missing values', function() {
        var vector = jd.seq(3).dropNa(-10);
        expect(vector.values).toEqual(jd.seq(3).values);

        var vector2 = jd.vector([], 'date').dropNa();
        expect(vector2.dtype).toBe('date');
        expect(vector2.values).toEqual([]);
      });
    });

    describe('replaceNa', function() {
      it('replaces missing values with "value"', function() {
        var vector = exampleVector.replaceNa(-10);
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([-10, 1, -10, 2, 3, -10]);
      });

      it('does not alter vectors with no missing values', function() {
        var vector = jd.seq(3).replaceNa(-10);
        expect(vector.values).toEqual(jd.seq(3).values);

        expect(jd.vector([]).replaceNa(-10).values).toEqual([]);
      });

      it('coerces "value" to the vector\'s dtype', function() {
        expect(exampleVector.replaceNa(null).values).toEqual(
          [NaN, 1, NaN, 2, 3, NaN]
        );
        expect(exampleVector.replaceNa('10').values).toEqual(
          [10, 1, 10, 2, 3, 10]
        );
      });
    });
  });

  describe('Array.prototype adaptations:', function() {
    var add = function(x, y) { return x + y; };
    var exampleNumVec = jd.vector([3, 0, 1, 20, 1]);

    describe('map', function() {

      it('behaves as expected for the typical case', function() {
        var vector = jd.seq(3).map(function(x) { return x.toString(); });
        expect(vector.dtype).toBe('string');
        expect(vector.values).toEqual(['0', '1', '2']);
      });

      it('defaults to using this vector\'s dtype when inference is ' +
        'inconslusive',
        function() {
          var vector = jd.vector(['0', '1']).map(function (x) { return null; });
          expect(vector.dtype).toBe('string');
          expect(vector.values).toEqual([null, null]);
        }
      );
    });

    describe('reduce', function() {

      it('behaves as expected', function() {
        expect(jd.seq(5).reduce(add, 10)).toBe(20);
      });
    });

    describe('reduceRight', function() {

      it('behaves as expected', function() {
        expect(jd.seq(5).reduceRight(add, 10)).toBe(20);
      });
    });

    describe('findIndex', function() {

      it('behaves as expected', function() {
        expect(exampleNumVec.findIndex(function(x) { return x === 1; }))
          .toBe(2);

        expect(exampleNumVec.findIndex(function(x) { return x === -10; }))
          .toBe(-1);
      });
    });

    describe('sort', function() {

      it('behaves as expected without modifying the original vector',
        function() {
          var vector = exampleNumVec.sort();
          expect(vector.dtype).toBe('number');
          expect(vector.values).toEqual([0, 1, 1, 3, 20]);
          expect(exampleNumVec.values).toEqual([3, 0, 1, 20, 1]);
        }
      );
    });

    describe('reverse', function() {

      it('behaves as expected without modifying the original vector',
        function() {
          var vector = exampleNumVec.reverse();
          expect(vector.dtype).toBe('number');
          expect(vector.values).toEqual([1, 20, 1, 0, 3]);
          expect(exampleNumVec.values).toEqual([3, 0, 1, 20, 1]);
        }
      );
    });

    describe('filter', function() {
      var exampleVector = jd.vector([null, true, false, null, true]);

      it('has arguments like Array.prototype.filter', function() {
        var callback = function(elem, index, array) {
          return index >= array.length - this.offset;
        };
        var vector = jd.seq(10).filter(callback, {offset: 3});
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([7, 8, 9]);
      });

      it('returns a vector with the same dtype as this vector', function() {
        var vector = exampleVector.filter(function(x) { return x === null; });
        expect(vector.dtype).toBe('boolean');
        expect(vector.values).toEqual([null, null]);
      });
    });
  });

  describe('comparison:', function() {
    // TODO
  });

});
