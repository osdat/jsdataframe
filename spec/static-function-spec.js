
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
      it('returns a number vector for number inputs', function() {
        var vector = jd.seq(-2, 4, 2);
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([-2, 0, 2]);
      });

      it('returns a character vector for character inputs', function() {
        var vector = jd.seq('A', 'F', 2);
        expect(vector.dtype).toBe('string');
        expect(vector.values).toEqual(['A', 'C', 'E']);
      });

      it('starts at 0 when numerical start is unspecified', function() {
        expect(jd.seq(5).values).toEqual([0, 1, 2, 3, 4]);
      });

      it('defaults to a step of 1', function() {
        expect(jd.seq(3, 6).values).toEqual([3, 4, 5]);
        expect(jd.seq('d', 'g').values).toEqual(['d', 'e', 'f']);
      });

      it('requires at least 2 arguments for character start/stop', function() {
        expect(function() {
          jd.seq('a');
        }).toThrowError(/arguments/);
      });

      it('requires string start/stop to be single characters', function() {
        expect(function() {
          jd.seq('a', 'not a character');
        }).toThrowError(/character/);
      });

      it('throws an error if start/stop have inconsistent dtypes', function() {
        expect(function() {
          jd.seq('a', 1);
        }).toThrowError(/dtype/);

        expect(function() {
          jd.seq(1, 'a');
        }).toThrowError(/dtype/);
      });

      it('can set includeStop to include stop', function() {
        expect(jd.seq(1, 5, 2, true).values).toEqual([1, 3, 5]);
        expect(jd.seq(3, 1, -1).values).toEqual([3, 2]);
        expect(jd.seq(3, 1, -1, true).values).toEqual([3, 2, 1]);

        expect(jd.seq('a', 'e', 2, true).values).toEqual(['a', 'c', 'e']);
        expect(jd.seq('c', 'a', -1, true).values).toEqual(['c', 'b', 'a']);
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

        expect(function() {
          jd.seq('a', 'e', 0);
        }).toThrowError(/nonzero/);

        expect(function() {
          jd.seq('a', 'e', -1);
        }).toThrowError(/positive/);

        expect(function() {
          jd.seq('e', 'a');
        }).toThrowError(/negative/);
      });

      it('returns an empty vector (includeStop false) or singleton vector ' +
        '(includeStop true) when start === stop',
        function() {
          expect(jd.seq(10, 10).values).toEqual([]);
          expect(jd.seq(10, 10, -1, true).values).toEqual([10]);

          expect(jd.seq('a', 'a').values).toEqual([]);
          expect(jd.seq('a', 'a', 1, true).values).toEqual(['a']);
        }
      );

      it('returns an empty number vector when called with no args', function() {
        var vector = jd.seq();
        expect(vector.dtype).toBe('number');
        expect(vector.values).toEqual([]);
      });
    });

    describe('jd.seqOut', function() {
      it('behaves as expected for number sequences', function() {
        expect(jd.seqOut(10, 3).values).toEqual([10, 11, 12]);
        expect(jd.seqOut(-2, 3, 2).values).toEqual([-2, 0, 2]);
        expect(jd.seqOut(0.5, 3, -0.5).values).toEqual([0.5, 0, -0.5]);
        expect(jd.seqOut(NaN, 2, -2).values).toEqual([NaN, NaN]);
        expect(jd.seqOut(0, 2, NaN).values).toEqual([0, NaN]);
        expect(jd.seqOut(0, 0).values).toEqual([]);
      });

      it('behaves as expected for character sequences', function() {
        expect(jd.seqOut('A', 4).values).toEqual(['A', 'B', 'C', 'D']);
        expect(jd.seqOut('a', 3, 2).values).toEqual(['a', 'c', 'e']);
        expect(jd.seqOut('z', 3, -1).values).toEqual(['z', 'y', 'x']);
      });

      it('throws an error if "lengthOut" is not a nonnegative integer',
        function() {
          expect(function() {
            jd.seqOut(0, 3.5);
          }).toThrowError(/integer/);

          expect(function() {
            jd.seqOut(0, -1);
          }).toThrowError(/nonnegative/);
        }
      );

      it('requires a string "start" to be a single character', function() {
        expect(function() {
          jd.seqOut('not a character', 3);
        }).toThrowError(/character/);
      });
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


  var numVec = jd.seq(5);
  var strVec = jd.seqOut('a', 5);
  var colNames = jd.vector(['A', 'B', 'C']);
  var exampleDf = jd.df([numVec, strVec, 10], colNames);

  describe('data frame creation:', function() {

    describe('jd.df', function() {

      describe('called with an array of columns', function() {
        it('behaves as expected', function() {
          var df1 = jd.df([numVec, ['a', 'b', 'c', 'd', 'e'], [10]],
            colNames);
          expect(df1.equals(exampleDf)).toBe(true);

          var df2 = jd.df([numVec, strVec, jd.vector([10])], colNames.values);
          expect(df2.equals(df1)).toBe(true);
        });

        it('generates column names when "colNames" is undefined', function() {
          var df = jd.df([numVec, strVec, 10]);
          expect(df.names().values).toEqual(['c0', 'c1', 'c2']);
          expect(df.resetNames().equals(exampleDf.resetNames()));
        });

        it('throws an error if "colNames" is the wrong length', function() {
          expect(function() {
            jd.df([numVec, strVec, 10], ['A', 'B']);
          }).toThrowError(/colNames/);
        });
      });

      describe('called with an object containing columns', function() {
        it('behaves as expected', function() {
          var colMap = {A: numVec, B: strVec.values, C: 10};
          var df = jd.df(colMap);
          expect(df.nCol()).toBe(3);
          expect(df.c('A').equals(colMap.A)).toBe(true);
          expect(df.c('B').equals(jd.vector(colMap.B))).toBe(true);
          expect(df.c('C').equals(jd.rep(10, 5))).toBe(true);
        });

        it('uses "colNames" to determine the column order', function() {
          var colMap = {A: numVec, B: strVec.values, C: 10};
          var colNames2 = ['B', 'C', 'A'];
          var df = jd.df(colMap, colNames2);
          expect(df.names().values).toEqual(colNames2);

          var expectedDf = jd.df([strVec, 10, numVec], colNames2);
          expect(df.equals(expectedDf)).toBe(true);
        });

        it('throws an error if "colNames" doesn\'t match the column keys',
          function() {
            var colMap = {A: numVec, B: strVec.values, C: 10};

            expect(function() {
              jd.df(colMap, ['A', 'B', 'Z']);
            }).toThrowError(/colNames/);

            expect(function() {
              jd.df(colMap, ['A', 'B']);
            }).toThrowError(/colNames/);

            expect(function() {
              jd.df(colMap, ['A', 'B', 'C', 'D']);
            }).toThrowError(/colNames/);
          }
        );

        it('throws an error if "colNames" has duplicates', function() {
          var colMap = {A: numVec, B: strVec.values, C: 10};

          expect(function() {
            jd.df(colMap, ['A', 'B', 'C', 'A']);
          }).toThrowError(/duplicate/);
        });

        it('throws an error if "colNames" has nulls', function() {
          var colMap = {A: numVec, B: strVec.values, C: 10};

          expect(function() {
            jd.df(colMap, ['A', 'B', 'C', null]);
          }).toThrowError(/null/);
        });
      });

      it('can be used to create a 1-row data frame', function() {
        var df = jd.df([0, 'a', 10], colNames);
        expect(df.nRow()).toBe(1);
        expect(df.nCol()).toBe(3);
        expect(df.names().values).toEqual(colNames.values);
        expect(df.toMatrix()).toEqual([[0, 'a', 10]]);
      });

      it('can be used to create different empty data frames', function() {
        var df = jd.df([]);
        expect(df.nRow()).toBe(0);
        expect(df.nCol()).toBe(0);
        expect(df.names().values).toEqual([]);

        var df2 = jd.df([10, []]);
        expect(df2.nRow()).toBe(0);
        expect(df2.nCol()).toBe(2);
      });

      it('throws an error if "columns" has vectors or arrays with ' +
        'incompatible lengths',
        function() {
          expect(function() {
            jd.df([numVec, jd.seq(4)]);
          }).toThrowError(/length/);

          expect(function() {
            jd.df([numVec, jd.vector([])]);
          }).toThrowError(/length/);
        }
      );

      it('throws an error if "columns" is undefined or invalid', function() {
        expect(function() {
          jd.df();
        }).toThrow();

        expect(function() {
          jd.df('invalid');
        }).toThrowError(/columns/);

        expect(function() {
          jd.df(numVec);
        }).toThrowError(/vector/);
      });
    });

    describe('jd.dfFromObjArray', function() {
      var objArray = [
        {A: 0, B: 'a', C: 10},
        {A: 1, B: 'b', C: 10},
        {A: 2, B: 'c', C: 10},
        {A: 3, B: 'd', C: 10},
        {A: 4, B: 'e', C: 10}
      ];

      it('behaves as expected with "colOrder" undefined', function() {
        var df = jd.dfFromObjArray(objArray);
        expect(df.nCol()).toBe(3);
        expect(df.c('A').equals(jd.seq(5))).toBe(true);
        expect(df.c('B').equals(jd.seqOut('a', 5))).toBe(true);
        expect(df.c('C').equals(jd.rep(10, 5))).toBe(true);
      });

      it('behaves as expected with "colOrder" specified', function() {
        var df = jd.dfFromObjArray(objArray, colNames);
        expect(df.equals(exampleDf)).toBe(true);

        var df2 = jd.dfFromObjArray(objArray, ['B', 'C', 'A']);
        expect(df2.names().values).toEqual(['B', 'C', 'A']);
        expect(df2.c(0).equals(jd.seqOut('a', 5))).toBe(true);
        expect(df2.c(1).equals(jd.rep(10, 5))).toBe(true);
        expect(df2.c(2).equals(jd.seq(5))).toBe(true);
      });

      it('allows for objects with different sets of properties', function() {
        var df = jd.dfFromObjArray([
          {A: 0},
          {A: 1,  B: 'b'},
          {B: 'c', C: 10}
        ]);
        var expectedDf = jd.df({
          A: [0, 1, NaN], B: [null, 'b', 'c'], C: [NaN, NaN, 10]
        }, ['A', 'B', 'C']);
        expect(df.equals(expectedDf)).toBe(true);
      });

      it('generates columns for every element of "colOrder" even if ' +
        'no object has a corresponding property',
        function() {
          var df = jd.dfFromObjArray([
            {A: 0},
            {A: 1},
            {A: 2}
          ], ['A', 'B']);
          var expectedDf = jd.df([jd.seq(3), jd.repNa(3, 'object')],
            ['A', 'B']);
          expect(df.equals(expectedDf)).toBe(true);

          // Test case where objArray is empty
          var df2 = jd.dfFromObjArray([], ['A', 'B']);
          expect(df2.nRow()).toBe(0);
          expect(df2.nCol()).toBe(2);
          expect(df2.names().values).toEqual(['A', 'B']);
        }
      );

      it('ignores properties not in "colOrder" if defined',
        function() {
          var df = jd.dfFromObjArray([
            {A: 0, B: 'a', C: 'ignored'},
            {A: 1, B: 'b'},
            {A: 2, B: 'c', D: 'ignored'}
          ], ['A', 'B']);
          var expectedDf = jd.df([jd.seq(3), jd.seqOut('a', 3)], ['A', 'B']);
          expect(df.equals(expectedDf)).toBe(true);
        }
      );

      it('throws an error if "objArray" is not an array', function() {
        expect(function() {
          jd.dfFromObjArray(jd.seq(5));
        }).toThrowError(/array/);

        expect(function() {
          jd.dfFromObjArray({a: 1, b: 2});
        }).toThrowError(/array/);
      });

      it('throws an error if "colOrder" has null or duplicate entries',
        function() {
          expect(function() {
            var df = jd.dfFromObjArray([
              {A: 0},
              {A: 1},
              {A: 2}
            ], ['A', null]);
          }).toThrowError(/null/);

          expect(function() {
            var df = jd.dfFromObjArray([
              {A: 0},
              {A: 1},
              {A: 2}
            ], ['A', 'A']);
          }).toThrowError(/duplicate/);
        }
      );
    });

    var matrix = [
      [0, 'a', 10],
      [1, 'b', 10],
      [2, 'c', 10],
      [3, 'd', 10],
      [4, 'e', 10]
    ];

    describe('jd.dfFromMatrix', function() {
      it('behaves as expected in the typical case', function() {
        var df = jd.dfFromMatrix(matrix, colNames);
        expect(df.equals(exampleDf)).toBe(true);
      });

      it('generates column names when "colNames" is undefined', function() {
        var df = jd.dfFromMatrix(matrix);
        expect(df.names().values).toEqual(['c0', 'c1', 'c2']);
        expect(df.resetNames().equals(exampleDf.resetNames()));
      });

      it('requires all row arrays to be of the same length', function() {
        expect(function() {
          jd.dfFromMatrix([
            [0, 'a'],
            [1, 'b', null],
            [2, 'c']
          ]);
        }).toThrowError(/row array/);
      });

      it('throws an error if "colNames" has the wrong length', function() {
        expect(function() {
          jd.dfFromMatrix(matrix, ['A', 'B']);
        }).toThrowError(/colNames/);
      });

      it('creates a 0-row data frame if "matrix" has length 0', function() {
        var df = jd.dfFromMatrix([], ['A', 'B']);
        expect(df.nRow()).toBe(0);
        expect(df.nCol()).toBe(2);
        expect(df.names().values).toEqual(['A', 'B']);

        var df2 = jd.dfFromMatrix([]);
        expect(df2.nRow()).toBe(0);
        expect(df2.nCol()).toBe(0);
        expect(df2.names().values).toEqual([]);
      });
    });

    describe('jd.dfFromMatrixWithHeader', function() {
      it('behaves as expected in the typical case', function() {
        var matrixWithHeader = [colNames.values].concat(matrix);
        var df = jd.dfFromMatrixWithHeader(matrixWithHeader);
        expect(df.equals(exampleDf)).toBe(true);
      });

      it('coerces the header row to string dtype', function() {
        var df = jd.dfFromMatrixWithHeader([
          [0, 1],
          [2, 3],
          [4, 5]
        ]);
        expect(df.nRow()).toBe(2);
        expect(df.names().values).toEqual(['0', '1']);
      });

      it('requires all row arrays (including header) to be of the same length',
        function() {
          expect(function() {
            jd.dfFromMatrixWithHeader([
              ['A', 'B'],
              [0, 'a'],
              [1, 'b', null],
              [2, 'c']
            ]);
          }).toThrowError(/row array/);

          expect(function() {
            jd.dfFromMatrixWithHeader([
              ['A', 'B', 'C'],
              [0, 'a'],
              [1, 'b'],
              [2, 'c']
            ]);
          }).toThrowError(/header/);
        }
      );

      it('throws an error if "matrix" has length 0', function() {
        expect(function() {
          jd.dfFromMatrixWithHeader([]);
        }).toThrowError(/0/);
      });

      it('creates a 0-row data frame if "matrix" has length 1', function() {
        var df = jd.dfFromMatrixWithHeader([['A', 'B']]);
        expect(df.nRow()).toBe(0);
        expect(df.nCol()).toBe(2);
        expect(df.names().values).toEqual(['A', 'B']);
      });
    });
  });

  describe('conversion:', function() {
    describe('jd.unpack', function() {
      it('throws an error if "obj" has unrecognized type', function() {
        expect(function() {
          jd.unpack({});
        }).toThrowError(/unrecognized type/);

        expect(function() {
          jd.unpack({type: 'invalid'});
        }).toThrowError(/unrecognized type/);
      });

      // See tests for vector.pack and df.pack
    });
  });

  describe('concatenation:', function() {

    describe('jd.vCat', function() {
      it('behaves as expected for standard usage', function() {
        var vector1 = jd.vCat(
          NaN, jd.seq(3), jd.vector([]), 10, [11, 12, null], []
        );
        expect(vector1.dtype).toBe('number');
        expect(vector1.values).toEqual([NaN, 0, 1, 2, 10, 11, 12, NaN]);

        var vector2 = jd.vCat('a', 'few', undefined, 'words');
        expect(vector2.dtype).toBe('string');
        expect(vector2.values).toEqual(['a', 'few', null, 'words']);
      });

      it('infers dtype "object" for mixed inputs, just like jd.vector',
        function() {
          var vector = jd.vCat(1, ['2', true]);
          expect(vector.dtype).toBe('object');
          expect(vector.values).toEqual([1, '2', true]);
        }
      );

      it('uses the first non-"object" dtype if inference is inconclusive',
        function() {
          var vector1 = jd.vCat(null, jd.repNa(2, 'object'),
            jd.repNa(2, 'boolean'), jd.repNa(3, 'string'));
          expect(vector1.dtype).toBe('boolean');
          expect(vector1.values).toEqual(jd.repNa(8, 'object').values);

          var vector2 = jd.vCat(null, jd.repNa(2, 'object'), [null, null]);
          expect(vector2.dtype).toBe('object');
          expect(vector2.values).toEqual(jd.repNa(5, 'object').values);
        }
      );

      it('creates an empty vector when given no input elements',
        function() {
          var vector1 = jd.vCat();
          expect(vector1.dtype).toBe('object');
          expect(vector1.values).toEqual([]);

          var vector2 = jd.vCat([], jd.vector([], 'object'), []);
          expect(vector2.dtype).toBe('object');
          expect(vector2.values).toEqual([]);

          var vector3 = jd.vCat([], jd.vector([], 'number'), []);
          expect(vector3.dtype).toBe('number');
          expect(vector3.values).toEqual([]);
        }
      );

      it('throws an error if any input is a data frame', function() {
        expect(function() {
          jd.vCat(1, 2, jd.df([jd.seq(3), jd.seq(3)]));
        }).toThrowError(/data frame/);
      });
    });

    var exampleDf1 = jd.df([jd.seq(5), jd.seqOut('a', 5), 10],
      ['A', 'B', 'C']);
    var exampleDf2 = jd.df(
      [jd.seq(5), jd.seq(5, 10), jd.seq(10, 15), jd.seq(15, 20)],
      ['A', null, 'B', 'A']
    );

    describe('jd.colCat', function() {
      it('behaves as expected for data frame arguments', function() {
        var df = jd.colCat(exampleDf, exampleDf, exampleDf);
        expect(df.nRow()).toBe(5);
        expect(df.nCol()).toBe(9);
        expect(df.names().values).toEqual(jd.rep(['A', 'B', 'C'], 3).values);
        expect(df.s(null, jd.rng(0, 3)).equals(exampleDf)).toBe(true);
        expect(df.s(null, jd.rng(3, 6)).equals(exampleDf)).toBe(true);
        expect(df.s(null, jd.rng(6, 9)).equals(exampleDf)).toBe(true);

        expect(jd.colCat(exampleDf).equals(exampleDf)).toBe(true);
      });

      it('concatenates data frames, vectors, arrays, and scalars correctly ' +
        'while allowing for column name shorthand via object wrapping',
        function() {
          var df1 = jd.colCat(
            {missingCol: NaN},
            exampleDf1,
            null,
            jd.df([]),  // empty data frames are ignored
            {letters: jd.seqOut('a', 5)},
            [100, 101, 102, 103, 104],
            exampleDf2.head(1),
            jd.df([])   // empty data frames are ignored
          );

          expect(df1.names().values).toEqual(
            ['missingCol', 'A', 'B', 'C', null, 'letters', null,
              'A', null, 'B', 'A']
          );
          expect(df1.c('missingCol').equals(jd.repNa(5, 'number'))).toBe(true);
          expect(df1.s(null, jd.rng(1, 4)).equals(exampleDf1)).toBe(true);
          expect(df1.c(4).equals(jd.repNa(5, 'object'))).toBe(true);
          expect(df1.c('letters').equals(jd.seqOut('a', 5))).toBe(true);
          expect(df1.c(6).equals(jd.seq(100, 105))).toBe(true);
          expect(df1.c(7).equals(jd.rep(0, 5))).toBe(true);
          expect(df1.c(8).equals(jd.rep(5, 5))).toBe(true);
          expect(df1.c(9).equals(jd.rep(10, 5))).toBe(true);
          expect(df1.c(10).equals(jd.rep(15, 5))).toBe(true);

          var df2 = jd.colCat(0, [1, 2, 3]);
          expect(df2.names().values).toEqual([null, null]);
          expect(df2.c(0).values).toEqual([0, 0, 0]);
          expect(df2.c(1).values).toEqual([1, 2, 3]);

          var df3 = jd.colCat(42);
          expect(df3.nRow()).toBe(1);
          expect(df3.nCol()).toBe(1);
          expect(df3.names().values).toEqual([null]);
          expect(df3.at(0, 0)).toBe(42);
        }
      );

      it('finds all keys within a column name wrapping object', function() {
        var df = jd.colCat({A: 'a', B: 'b'}, {C: 'c', D: jd.seq(3)});
        expect(df.nRow()).toBe(3);
        expect(df.nCol()).toBe(4);
        expect(df.c('A').equals(jd.rep('a', 3))).toBe(true);
        expect(df.c('B').equals(jd.rep('b', 3))).toBe(true);
        expect(df.c('C').equals(jd.rep('c', 3))).toBe(true);
        expect(df.c('D').equals(jd.seq(3))).toBe(true);
      });

      it('creates an empty data frame if called without arguments', function() {
        var df = jd.colCat();
        expect(df.nRow()).toBe(0);
        expect(df.nCol()).toBe(0);

        expect(jd.colCat(df, df).equals(df)).toBe(true);
      });

      it('throws an error if arguments have incompatible lengths', function() {
        expect(function() {
          jd.colCat(jd.seq(5), jd.seq(4));
        }).toThrowError(/length/);

        expect(function() {
          jd.colCat(exampleDf1, jd.seq(4));
        }).toThrowError(/length/);

        expect(function() {
          jd.colCat(exampleDf1, jd.vector([]));
        }).toThrowError(/length/);

        expect(function() {
          jd.colCat(exampleDf1, exampleDf1.head(2));
        }).toThrowError(/length/);
      });
    });

    describe('jd.rowCat', function() {
      it('behaves as expected for data frame arguments', function() {
        var df = jd.rowCat(exampleDf, exampleDf, exampleDf);
        expect(df.nRow()).toBe(15);
        expect(df.nCol()).toBe(3);
        expect(df.names().values).toEqual(['A', 'B', 'C']);
        expect(df.c('A').equals(jd.rep(jd.seq(5), 3))).toBe(true);
        expect(df.c('B').equals(jd.rep(jd.seqOut('a', 5), 3))).toBe(true);
        expect(df.c('C').equals(jd.rep(10, 15))).toBe(true);

        expect(jd.rowCat(exampleDf).equals(exampleDf)).toBe(true);
      });

      it('concatenates data frames, vectors, arrays, and scalars correctly ' +
        'while nulling out column names that are inconsistent',
        function() {
          var df1 = jd.rowCat(exampleDf1, exampleDf2.s(null, jd.rng(0, 3)));
          expect(df1.nRow()).toBe(10);
          expect(df1.nCol()).toBe(3);
          expect(df1.names().values).toEqual(['A', null, null]);
          expect(df1.dtypes().c('dtype').values).toEqual(
            ['number', 'object', 'number']
          );
          expect(df1.c(0).equals(jd.rep(jd.seq(5), 2))).toBe(true);
          expect(df1.c(1).equals(
            jd.vCat(jd.seqOut('a', 5), jd.seq(5, 10)))).toBe(true);
          expect(df1.c(2).equals(
            jd.vCat(jd.rep(10, 5), jd.seq(10, 15)))).toBe(true);

          var df2 = jd.rowCat(
            null,
            jd.df([]),  // empty data frames are ignored
            exampleDf1,
            [5, 'f', 10],
            jd.df([[], [], []], ['A', 'B', 'inconsistent']),
            jd.vector([6, 'g', false]),
            jd.df([])   // empty data frames are ignored
          );
          expect(df2.names().values).toEqual(['A', 'B', null]);
          expect(df2.c('A').equals(jd.vCat(NaN, jd.seq(7)))).toBe(true);
          expect(df2.c('B').equals(
            jd.vCat(null, jd.seqOut('a', 7)))).toBe(true);
          expect(df2.c(null).equals(
            jd.vCat(null, jd.rep(10, 6), false))).toBe(true);

          var df3 = jd.rowCat(0, [1, 2, 3]);
          expect(df3.nCol()).toBe(3);
          expect(df3.names().values).toEqual([null, null, null]);
          expect(df3.c(0).values).toEqual([0, 1]);
          expect(df3.c(1).values).toEqual([0, 2]);
          expect(df3.c(2).values).toEqual([0, 3]);

          var df4 = jd.rowCat(42);
          expect(df4.nRow()).toBe(1);
          expect(df4.nCol()).toBe(1);
          expect(df4.names().values).toEqual([null]);
          expect(df4.at(0, 0)).toBe(42);
        }
      );

      it('creates an empty data frame if called without arguments', function() {
        var df = jd.rowCat();
        expect(df.nRow()).toBe(0);
        expect(df.nCol()).toBe(0);

        expect(jd.rowCat(df, df).equals(df)).toBe(true);
      });

      it('throws an error if arguments have incompatible lengths', function() {
        expect(function() {
          jd.rowCat(jd.seq(5), jd.seq(4));
        }).toThrowError(/number/);

        expect(function() {
          jd.rowCat(exampleDf1, jd.seq(4));
        }).toThrowError(/number/);

        expect(function() {
          jd.rowCat(exampleDf1, jd.vector([]));
        }).toThrowError(/number/);

        expect(function() {
          jd.rowCat(exampleDf1, exampleDf2);
        }).toThrowError(/number/);

        expect(function() {
          jd.rowCat(exampleDf1, exampleDf1.s(null, 0));
        }).toThrowError(/number/);
      });
    });

    describe('jd.strCat', function() {
      it('behaves as expected for standard usage', function() {
        var strVec = jd.strCat('(c', jd.seq(3), '_', ['x', 'y', 'z'], ')');
        expect(strVec.dtype).toBe('string');
        expect(strVec.values).toEqual(
          ['(c0_x)', '(c1_y)', '(c2_z)']
        );

        var strVec2 = jd.strCat(jd.vector([1, NaN, 3]), ' ',
          jd.vector([true, false, null]));
        expect(strVec2.values).toEqual(
          ['1 true', null, null]
        );
      });

      it('requires all vectors/arrays to have compatible lengths', function() {
        expect(function() {
          jd.strCat(['a', 'b', 'c'], jd.seq(5));
        }).toThrowError(/length/);
      });

      it('requires at least one argument', function() {
        expect(function() {
          jd.strCat();
        }).toThrowError(/argument/);
      });
    });
  });

  describe('printing:', function() {

    describe('toPrintString', function() {
      it('works for vectors', function() {
        var printStr1 = jd.seq(5).printToString();
        expect(printStr1.split('\n').length).toBe(6);

        var printStr2 = jd.seq(500).printToString();
        expect(typeof printStr2).toBe('string');
      });

      it('works for data frames', function() {
        var df = jd.df([jd.seq(500), jd.strCat('row ', jd.seq(500))]);
        var printStr1 = df.head(5).printToString();
        expect(printStr1.split('\n').length).toBe(7);

        var printStr2 = df.printToString();
        expect(typeof printStr2).toBe('string');
      });
    });
  });

  describe("The jsdataframe version", function() {
    it("is a string property", function() {
      expect(typeof jd.version).toBe('string');
    });
  });
});
