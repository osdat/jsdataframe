
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
    var numberVector = jd.vector([NaN, 0, 1, 2]);
    var dateVector = numberVector.toDtype('date');
    var date = new Date(1);

    describe('all element-wise comparison operators', function() {
      var operators = ['eq', 'neq', 'lt', 'gt', 'lte', 'gte'];

      it('return a boolean vector of the right length', function() {
        operators.forEach(function(op) {
          var vector = numberVector[op](null);
          expect(vector.dtype).toBe('boolean');
          expect(vector.size()).toBe(4);
        });
      });

      it('propagate missing values from either side of the comparison',
        function() {
          var numVec1 = jd.vector([NaN, NaN, 1, 2]);
          var numVec2 = jd.vector([NaN, 0, NaN, 2]);
          var dateVec1 = numVec1.toDtype('date');
          var dateVec2 = numVec2.toDtype('date');

          operators.forEach(function(op) {
            var numVecResult = numVec1[op](numVec2);
            expect(numVecResult.dtype).toBe('boolean');
            expect(numVecResult.isNa().values).toEqual(
              [true, true, true, false]
            );

            var dateVecResult = dateVec1[op](dateVec2);
            expect(dateVecResult.dtype).toBe('boolean');
            expect(dateVecResult.isNa().values).toEqual(
              [true, true, true, false]
            );
          });
        }
      );

      it('return a vector full of missing values if the dtypes differ',
        function() {
          operators.forEach(function(op) {
            var vector = numberVector[op](dateVector);
            expect(vector.dtype).toBe('boolean');
            expect(vector.isNa().values).toEqual(
              [true, true, true, true]
            );
          });
        }
      );
    });

    describe('eq', function() {
      it('checks element-wise equality', function() {
        expect(numberVector.eq(numberVector).values).toEqual(
          [null, true, true, true]
        );
        expect(numberVector.eq(numberVector.values).values).toEqual(
          [null, true, true, true]
        );
        expect(dateVector.eq(dateVector).values).toEqual(
          [null, true, true, true]
        );
        expect(dateVector.eq(dateVector.values).values).toEqual(
          [null, true, true, true]
        );
      });

      it('compares "object" vectors via shallow equality', function() {
        var obj = {};
        var vector1 = jd.vector([obj, obj, NaN, null]);
        var vector2 = jd.vector([obj, {}, 1, 2]);

        expect(vector1.eq(vector2).values).toEqual(
          [true, false, null, null]
        );
        expect(vector2.eq(vector1).values).toEqual(
          [true, false, null, null]
        );
      });
    });

    describe('neq', function() {
      it('checks element-wise non-equality', function() {
        expect(numberVector.neq(numberVector).values).toEqual(
          [null, false, false, false]
        );
        expect(numberVector.neq(numberVector.values).values).toEqual(
          [null, false, false, false]
        );
        expect(dateVector.neq(dateVector).values).toEqual(
          [null, false, false, false]
        );
        expect(dateVector.neq(dateVector.values).values).toEqual(
          [null, false, false, false]
        );
      });
    });

    describe('lt', function() {
      it('checks element-wise less than', function() {
        expect(numberVector.lt(1).values).toEqual(
          [null, true, false, false]
        );
        expect(numberVector.lt([1]).values).toEqual(
          [null, true, false, false]
        );
        expect(dateVector.lt(date).values).toEqual(
          [null, true, false, false]
        );
        expect(dateVector.lt([date]).values).toEqual(
          [null, true, false, false]
        );
      });
    });

    describe('gt', function() {
      it('checks element-wise greater than', function() {
        expect(numberVector.gt(1).values).toEqual(
          [null, false, false, true]
        );
        expect(dateVector.gt(date).values).toEqual(
          [null, false, false, true]
        );
      });
    });

    describe('lte', function() {
      it('checks element-wise less than or equal to', function() {
        expect(numberVector.lte(1).values).toEqual(
          [null, true, true, false]
        );
        expect(dateVector.lte(date).values).toEqual(
          [null, true, true, false]
        );
      });
    });

    describe('gte', function() {
      it('checks element-wise greater than or equal to', function() {
        expect(numberVector.gte(1).values).toEqual(
          [null, false, true, true]
        );
        expect(dateVector.gte(date).values).toEqual(
          [null, false, true, true]
        );
      });
    });

    describe('equals', function() {
      it('returns false if "other" is not a vector or if the vectors have ' +
        'different lengths or dtypes',
        function() {
          expect(numberVector.equals(1)).toBe(false);
          expect(numberVector.equals(numberVector.values)).toBe(false);
          expect(numberVector.equals(jd.vector([NaN, 0, 1, 2, 3]))).toBe(false);
          expect(numberVector.equals(date)).toBe(false);
        }
      );

      it('returns true for vectors with identical elements', function() {
        expect(numberVector.equals(numberVector)).toBe(true);
        expect(numberVector.equals(jd.vector(numberVector.values))).toBe(true);
        expect(dateVector.equals(dateVector)).toBe(true);
        expect(dateVector.equals(jd.vector(dateVector.values))).toBe(true);
        expect(jd.vector(['a', 'b']).equals(jd.vector(['a', 'b']))).toBe(true);
        expect(jd.vector([]).equals(jd.vector([]))).toBe(true);
      });

      it('returns true for slightly different number vectors within the ' +
        'right tolerance',
        function() {
          var numVec2 = jd.vector([NaN, 1e-7, 1 - 1e-10, 2]);
          var numVecCopy = jd.vector(numberVector.values);
          expect(numberVector.equals(numVec2)).toBe(true);
          expect(numberVector.equals(numVec2, 0)).toBe(false);
          expect(numberVector.equals(numVecCopy, 0)).toBe(true);

          expect(jd.vector([NaN]).equals(jd.vector([1]))).toBe(false);
          expect(jd.vector([1]).equals(jd.vector([NaN]))).toBe(false);
        }
      );

      it('performs shallow equality with === for "object" dtype, but NaN ' +
        'elements compare equal to each other',
        function() {
          var obj = {};
          var vector1 = jd.vector([1, '2', obj, NaN, null], 'object');
          var vector1Copy = jd.vector([1, '2', obj, NaN, null], 'object');
          var vector2 = jd.vector([1, '2', {}, NaN, null], 'object');

          expect(vector1.values).toEqual([1, '2', obj, NaN, null]);
          expect(vector1.equals(vector1Copy)).toBe(true);
          expect(vector1.equals(vector2)).toBe(false);

          // Shallow equality of "object" vectors gives conflicting results
          // from "date" vectors
          expect(jd.vector([new Date(0)]).equals(jd.vector([new Date(0)])))
            .toBe(true);
          expect(jd.vector([new Date(0)], 'object').equals(
            jd.vector([new Date(0)], 'object'))).toBe(false);
        }
      );
    });
  });

});
