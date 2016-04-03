
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('static functions:', function() {
  "use strict";

  describe('vector creation:', function() {
    var unixStart = new Date(Date.UTC(1970, 0, 1));

    describe('jd.vector', function() {

      it('infers the dtype when not specified', function() {
        // Store array of examples where each example is a triple
        // with input array first, then expected dtype, then expected values
        var exampleArray = [
          [[0, 1, 2], 'number', [0, 1, 2]],
          [[NaN, null, 1], 'number', [NaN, NaN, 1]],
          [[null, 1, '2'], 'object', [null, 1, '2']],
          [[undefined, null, NaN], 'number', [NaN, NaN, NaN]],
          [[null, 'x', 'y', undefined], 'string', [null, 'x', 'y', null]],
          [[true, false, undefined], 'boolean', [true, false, null]],
          [[null, unixStart, undefined], 'date', [null, unixStart, null]],
          [[['array'], {}, 0], 'object', [['array'], {}, 0]],
          [[null, undefined, null], 'object', [null, undefined, null]],
          [[], 'object', []]
        ];

        exampleArray.forEach(function(example) {
          var vector = jd.vector(example[0]);
          expect(vector.dtype).toBe(example[1]);
          expect(vector.values).toEqual(example[2]);
        });
      });

      it('coerces all elements to the dtype', function() {
        var array, vector;

        array = [null, true, unixStart, '-1'];
        vector = jd.vector(array, 'number');
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([NaN, 1, 0, -1]);

        array = [NaN, 1, true];
        vector = jd.vector(array, 'string');
        expect(vector.dtype).toBe('string');
        expect(vector.values).toEqual([null, '1', 'true']);
      });

      it('copies the array by default but will use it directly ' +
        'if "copyArray" is false',
        function() {
          var array = [null, 1, 2];
          var vector1 = jd.vector(array, null);
          var vector2 = jd.vector(array, null, false);
          var vector3 = jd.vector(array, null, true);

          array[2] = -1;
          vector3.values[0] = 0;  // it's not recommended to modify "values" in general

          expect(vector1.values).toEqual([NaN, 1, 2]);
          expect(vector2.values).toEqual([NaN, 1, -1]);
          expect(vector2.values).toBe(array);
          expect(vector3.values).toEqual([0, 1, 2]);
        }
      );

      it('throws an exception for invalid dtypes', function() {
        expect(function() {
          jd.vector([], 'invalid');
        }).toThrowError(/invalid dtype/);
      });

      it('throws an exception if "array" is not an array', function() {
        expect(function() {
          jd.vector('test');
        }).toThrowError(/array/);
      });
    });

    describe('jd.seq', function() {
      it('returns a number vector', function() {
        var vector = jd.seq(-2, 4, 2);
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([-2, 0, 2]);
      });

      it('starts at 0 when start is unspecified', function() {
        expect(jd.seq(5).values).toEqual([0, 1, 2, 3, 4]);
      });

      it('defaults to a step of 1', function() {
        expect(jd.seq(3, 6).values).toEqual([3, 4, 5]);
      });

      it('can set includeStop to include stop', function() {
        expect(jd.seq(1, 5, 2, true).values).toEqual([1, 3, 5]);
        expect(jd.seq(3, 1, -1).values).toEqual([3, 2]);
        expect(jd.seq(3, 1, -1, true).values).toEqual([3, 2, 1]);
      });

      it('throws an error when step is zero or has the wrong sign', function() {
        expect(function() {
          jd.seq(1, 4, 0);
        }).toThrowError(/nonzero/);

        expect(function() {
          jd.seq(1, 5, -1);
        }).toThrowError(/positive/);

        expect(function() {
          jd.seq(5, 1);
        }).toThrowError(/negative/);
      });

      it('returns an empty vector (includeStop false) or singleton vector ' +
        '(includeStop true) when start === stop',
        function() {
          expect(jd.seq(10, 10).values).toEqual([]);
          expect(jd.seq(10, 10, -1, true).values).toEqual([10]);
        }
      );

      it('returns an empty number vector when called with no args', function() {
        var vector = jd.seq();
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([]);
      });
    });

    describe('jd.seqOut', function() {
      it('behaves as expected when called correctly', function() {
        expect(jd.seqOut(-2, 2, 3).values).toEqual([-2, 0, 2]);
        expect(jd.seqOut(0.5, -0.5, 3).values).toEqual([0.5, 0, -0.5]);
        expect(jd.seqOut(NaN, -2, 2).values).toEqual([NaN, NaN]);
        expect(jd.seqOut(0, NaN, 2).values).toEqual([0, NaN]);
        expect(jd.seqOut(0, 1, 0).values).toEqual([]);
      });

      it('throws an error if "lengthOut" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.seqOut(0, 1, 3.5);
          }).toThrowError(/integer/);

          expect(function() {
            jd.seqOut(0, 1, -1);
          }).toThrowError(/nonnegative/);
        }
      );
    });

    describe('jd.linspace', function() {
      it('behaves as expected when called correctly', function() {
        expect(jd.linspace(-2, 2, 5).values).toEqual([-2, -1, 0, 1, 2]);
        expect(jd.linspace(0.5, -0.5, 3).values).toEqual([0.5, 0, -0.5]);
        expect(jd.linspace(0, 1, 2).values).toEqual([0, 1]);
        expect(jd.linspace(0, 1, 1).values).toEqual([0]);
        expect(jd.linspace(0, 1, 0).values).toEqual([]);
      });

      it('throws an error if "length" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.linspace(0, 1, 3.5);
          }).toThrowError(/integer/);

          expect(function() {
            jd.linspace(0, 1, -1);
          }).toThrowError(/nonnegative/);
        }
      );
    });

    describe('jd.rep', function() {
      it('behaves as expected when called correctly', function() {
        expect(jd.rep(1, 3).values).toEqual([1, 1, 1]);
        expect(jd.rep('y', 2).values).toEqual(['y', 'y']);
        expect(jd.rep([1, 2], 3).values).toEqual([1, 2, 1, 2, 1, 2]);
        expect(jd.rep(jd.seq(2), 2).values).toEqual([0, 1, 0, 1]);
        expect(jd.rep(jd.seq(2), 1).values).toEqual([0, 1]);
        expect(jd.rep(jd.seq(2), 0).values).toEqual([]);
        expect(jd.rep([], 10).values).toEqual([]);
        expect(jd.rep(null, 2).values).toEqual([null, null]);
      });

      it('throws an error if "times" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.rep(1, 3.5);
          }).toThrowError(/integer/);

          expect(function() {
            jd.rep(1, -1);
          }).toThrowError(/nonnegative/);
        }
      );
    });

    describe('jd.repEach', function() {
      it('behaves as expected when called correctly', function() {
        expect(jd.repEach(1, 3).values).toEqual([1, 1, 1]);
        expect(jd.repEach('y', 2).values).toEqual(['y', 'y']);
        expect(jd.repEach([1, 2], 3).values).toEqual([1, 1, 1, 2, 2, 2]);
        expect(jd.repEach(jd.seq(2), 2).values).toEqual([0, 0, 1, 1]);
        expect(jd.repEach(jd.seq(2), 1).values).toEqual([0, 1]);
        expect(jd.repEach(jd.seq(2), 0).values).toEqual([]);
        expect(jd.repEach([], 10).values).toEqual([]);
        expect(jd.repEach(null, 2).values).toEqual([null, null]);
      });

      it('throws an error if "times" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.repEach(1, 3.5);
          }).toThrowError(/integer/);

          expect(function() {
            jd.repEach(1, -1);
          }).toThrowError(/nonnegative/);
        }
      );
    });

    describe('jd.repNa', function() {
      it('behaves as expected when called correctly', function() {
        expect(jd.repNa(3, 'string').values).toEqual([null, null, null]);
        expect(jd.repNa(1, 'string').values).toEqual([null]);

        var numVec = jd.repNa(3, 'number');
        expect(numVec.values).toEqual([NaN, NaN, NaN]);
        expect(numVec.dtype).toBe('number');

        var boolVec = jd.repNa(3, 'boolean');
        expect(boolVec.values).toEqual([null, null, null]);
        expect(boolVec.dtype).toBe('boolean');

        var emptyVec = jd.repNa(0, 'string');
        expect(emptyVec.values).toEqual([]);
        expect(emptyVec.dtype).toBe('string');
      });

      it('throws an error if "times" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.repNa(3.5, 'string');
          }).toThrowError(/integer/);

          expect(function() {
            jd.repNa(-1, 'string');
          }).toThrowError(/nonnegative/);
        }
      );

      it('throws an error for invalid dtypes',
        function() {
          expect(function() {
            jd.repNa(3, 'not a dtype');
          }).toThrowError(/invalid/);

          expect(function() {
            jd.repNa(3, null);
          }).toThrowError(/invalid/);
        }
      );
    });
  });

});
