
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('data frame methods:', function() {
  "use strict";

  var exampleDf1 = jd.df([jd.seq(5), jd.seqOut('a', 5), 10],
    ['A', 'B', 'C']);
  var exampleDf2 = jd.df(
    [jd.seq(5), jd.seq(5, 10), jd.seq(10, 15), jd.seq(15, 20)],
    ['A', null, 'B', 'A']
  );

  describe('general:', function() {

    describe('df.allDtype', function() {
      it('returns null if the columns have different dtypes', function() {
        expect(exampleDf1.allDtype).toBe(null);
      });

      it('returns the overall dtype if all columns are consistent', function() {
        var df = jd.df([jd.seq(2), [10, null]]);
        expect(df.allDtype).toBe('number');

        var df2 = jd.df(['test', 'data', 'frame']);
        expect(df2.allDtype).toBe('string');
      });
    });

    describe('df.nRow', function() {
      it('returns the number of rows in the data frame', function() {
        expect(exampleDf1.nRow()).toBe(5);
        expect(jd.df([]).nRow()).toBe(0);
        expect(jd.df([1, 2, 3]).nRow()).toBe(1);
        expect(jd.df([jd.seq(3)]).nRow()).toBe(3);
      });
    });

    describe('df.nCol', function() {
      it('returns the number of columns in the data frame', function() {
        expect(exampleDf1.nCol()).toBe(3);
        expect(jd.df([]).nCol()).toBe(0);
        expect(jd.df([1, 2, 3]).nCol()).toBe(3);
        expect(jd.df([jd.seq(3)]).nCol()).toBe(1);
      });
    });

    describe('df.dtypes', function() {
      it('returns the dtypes of all the columns', function() {
        var dtypes = exampleDf1.dtypes();
        expect(dtypes.names().values).toEqual(['colName', 'dtype']);
        expect(dtypes.c('colName').values).toEqual(exampleDf1.names().values);
        expect(dtypes.c('dtype').values).toEqual(
          ['number', 'string', 'number']
        );

        var dtypes2 = jd.df([]).dtypes();
        expect(dtypes2.names().values).toEqual(['colName', 'dtype']);
        expect(dtypes2.nRow()).toBe(0);
      });
    });

    describe('df.colVectors', function() {
      it('returns an array of the column vectors by default', function() {
        var colVecArr = exampleDf1.colVectors();
        expect(colVecArr.length).toBe(3);
        expect(colVecArr[0].equals(jd.seq(5))).toBe(true);
        expect(colVecArr[1].equals(jd.seqOut('a', 5))).toBe(true);
        expect(colVecArr[2].equals(jd.rep(10, 5))).toBe(true);
      });

      describe('if "asObject" is true', function() {
        it('returns an object with null prototype', function() {
            var colVecMap = exampleDf1.colVectors(true);
            expect(Object.keys(colVecMap).length).toBe(3);
            expect('toString' in colVecMap).toBe(false);
            expect(colVecMap.A.equals(jd.seq(5))).toBe(true);
            expect(colVecMap.B.equals(jd.seqOut('a', 5))).toBe(true);
            expect(colVecMap.C.equals(jd.rep(10, 5))).toBe(true);
        });

        it('only selects the first occurrence if there are duplicate ' +
          'column names and ignores null column names',
          function() {
            var colVecMap = exampleDf2.colVectors(true);
            expect(Object.keys(colVecMap).length).toBe(2);
            expect('toString' in colVecMap).toBe(false);
            expect(colVecMap.A.equals(jd.seq(5))).toBe(true);
            expect(colVecMap.B.equals(jd.seq(10, 15))).toBe(true);
          }
        );
      });
    });

    describe('df.equals', function() {
      it('returns false if "other" is not a data frame', function() {
        expect(exampleDf1.equals(jd.seq(5))).toBe(false);
        expect(exampleDf1.equals('some string')).toBe(false);
        expect(exampleDf1.equals(null)).toBe(false);
      });

      it('returns false for data frames with different dimensions',
        function() {
          expect(exampleDf1.equals(exampleDf2)).toBe(false);
          expect(jd.df([1, 2]).equals(jd.df([[1, 2], [3, 4]]))).toBe(false);
        }
      );

      it('returns false for data frames with different column names',
        function() {
          expect(exampleDf2.equals(exampleDf2.resetNames())).toBe(false);
        }
      );

      it('returns false for data frames with non-equal column vectors',
        function() {
          var df = jd.df([[0, 1, -2, 3, 4], jd.seqOut('a', 5), 10],
            ['A', 'B', 'C']);
          expect(df.equals(exampleDf1)).toBe(false);
        }
      );

      it('returns true if all column names and vectors are equal given ' +
        ' the numerical tolerance',
        function() {
          var df = jd.df([[0, 1, 2 + 1e-14, 3, 4], jd.seqOut('a', 5), 10],
            ['A', 'B', 'C']);
          expect(df.equals(exampleDf1)).toBe(true);
          expect(df.equals(exampleDf1, 0)).toBe(false);
        }
      );
    });
  });

  describe('conversion:', function() {

    var createCleanMap = function(obj) {
      var result = Object.create(null);
      Object.keys(obj).forEach(function(key) {
        result[key] = obj[key];
      });
      return result;
    };

    describe('df.toObjArray', function() {
      it('behaves as expected in the typical case', function() {
        expect(exampleDf1.toObjArray()).toEqual([
          {A: 0, B: 'a', C: 10},
          {A: 1, B: 'b', C: 10},
          {A: 2, B: 'c', C: 10},
          {A: 3, B: 'd', C: 10},
          {A: 4, B: 'e', C: 10}
        ].map(createCleanMap));
      });

      it('returns objects that have null prototype', function() {
        exampleDf1.toObjArray().forEach(function(rowObj) {
          expect('toString' in rowObj).toBe(false);
        });
      });

      it('uses the first occurrence for a duplicated column name and ' +
        'ignores null column names',
        function() {
          expect(exampleDf2.toObjArray()).toEqual([
            {A: 0, B: 10},
            {A: 1, B: 11},
            {A: 2, B: 12},
            {A: 3, B: 13},
            {A: 4, B: 14}
          ].map(createCleanMap));
        }
      );
    });

    describe('df.toMatrix', function() {
      it('behaves as expected when "includeHeader" is false (the default)',
        function() {
          expect(exampleDf1.toMatrix()).toEqual([
            [0, 'a', 10],
            [1, 'b', 10],
            [2, 'c', 10],
            [3, 'd', 10],
            [4, 'e', 10],
          ]);
          expect(exampleDf1.toMatrix()).toEqual(exampleDf1.toMatrix(false));

          expect(exampleDf2.toMatrix()).toEqual([
            [0, 5, 10, 15],
            [1, 6, 11, 16],
            [2, 7, 12, 17],
            [3, 8, 13, 18],
            [4, 9, 14, 19],
          ]);
        }
      );

      it('includes an initial header row when "includeHeader" is true',
        function() {
          expect(exampleDf1.toMatrix(true)).toEqual([
            ['A', 'B', 'C'],
            [0, 'a', 10],
            [1, 'b', 10],
            [2, 'c', 10],
            [3, 'd', 10],
            [4, 'e', 10],
          ]);
          expect(exampleDf2.toMatrix(true)).toEqual([
            ['A', null, 'B', 'A'],
            [0, 5, 10, 15],
            [1, 6, 11, 16],
            [2, 7, 12, 17],
            [3, 8, 13, 18],
            [4, 9, 14, 19],
          ]);
        }
      );

      it('returns a single header row when "includeHeader" is true for a ' +
        '0-row data frame that contains columns',
        function() {
          expect(jd.df([[], []], ['A', 'B']).toMatrix(true)).toEqual([
            ['A', 'B']
          ]);
        }
      );
    });
  });

  describe('column names:', function() {

    describe('df.names', function() {
      it('returns a string vector of the right length', function() {
        var colNames1 = exampleDf1.names();
        expect(colNames1.dtype).toBe('string');
        expect(colNames1.values).toEqual(['A', 'B', 'C']);

        var colNames2 = exampleDf2.names();
        expect(colNames2.dtype).toBe('string');
        expect(colNames2.values).toEqual(['A', null, 'B', 'A']);

        // Check 0-row case also
        var colNames3 = jd.df([[], []], ['A', 'B']).names();
        expect(colNames3.dtype).toBe('string');
        expect(colNames3.values).toEqual(['A', 'B']);
      });
    });

    describe('df.resetNames', function() {
      it('returns a new data frame with column names reset', function() {
        var df = exampleDf2.resetNames();
        expect(df === exampleDf2).toBe(false);
        expect(df.names().values).toEqual(['c0', 'c1', 'c2', 'c3']);
      });
    });
  });

  describe('subset selection / modification:', function() {

    describe('df.c', function() {
      it('behaves as expected for integer indexing', function() {
        expect(exampleDf1.c(0).equals(jd.seq(5))).toBe(true);
        expect(exampleDf1.c([0]).equals(jd.seq(5))).toBe(true);
        expect(exampleDf1.c(jd.seq(1)).equals(jd.seq(5))).toBe(true);
        expect(exampleDf2.c(3).equals(jd.seq(15, 20))).toBe(true);

        // Check negative index also
        expect(exampleDf1.c(-1).equals(jd.rep(10, 5))).toBe(true);
        expect(exampleDf2.c(-4).equals(jd.seq(5))).toBe(true);
      });

      it('throws an error for numbers out of bounds', function() {
        expect(function() {
          exampleDf1.c(-4);
        }).toThrowError(/bounds/);

        expect(function() {
          exampleDf1.c(3);
        }).toThrowError(/bounds/);
      });

      it('behaves as expected for column name indexing', function() {
        expect(exampleDf1.c('A').equals(jd.seq(5))).toBe(true);
        expect(exampleDf1.c(['A']).equals(jd.seq(5))).toBe(true);
        expect(exampleDf1.c(jd.seqOut('A', 1)).equals(jd.seq(5))).toBe(true);
        expect(exampleDf1.c('C').equals(jd.rep(10, 5))).toBe(true);

        expect(exampleDf2.c('B').equals(jd.seq(10, 15))).toBe(true);
        expect(exampleDf2.c(null).equals(jd.seq(5, 10))).toBe(true);
      });

      it('selects the first occurrence for duplicate names', function() {
        expect(exampleDf2.c('A').equals(jd.seq(5))).toBe(true);
      });

      it('throws an error if a column name isn\'t found', function() {
        expect(function() {
          exampleDf1.c('columnZ');
        }).toThrowError(/columnZ/);
      });

      it('throws an error if "colSelect" has length > 1', function() {
        expect(function() {
          exampleDf1.c(jd.seq(2));
        }).toThrowError(/single/);

        expect(function() {
          exampleDf1.c(jd.seqOut('A', 2));
        }).toThrowError(/single/);
      });

      it('throws an error if "colSelect" is not an int or string', function() {
        expect(function() {
          exampleDf1.c();
        }).toThrowError(/undefined/);

        expect(function() {
          exampleDf1.c(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          exampleDf1.c(true);
        }).toThrowError(/integer/);
      });
    });
  });

});
