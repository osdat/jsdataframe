
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

    describe('df.colArray', function() {
      it('returns an array of the column vectors', function() {
        var colArr = exampleDf1.colArray();
        expect(colArr.length).toBe(3);
        expect(colArr[0].equals(jd.seq(5))).toBe(true);
        expect(colArr[1].equals(jd.seqOut('a', 5))).toBe(true);
        expect(colArr[2].equals(jd.rep(10, 5))).toBe(true);
      });
    });

    describe('df.colMap', function() {
      it('returns an object with null prototype', function() {
          var colMap = exampleDf1.colMap();
          expect(Object.keys(colMap).length).toBe(3);
          expect('toString' in colMap).toBe(false);
          expect(colMap.A.equals(jd.seq(5))).toBe(true);
          expect(colMap.B.equals(jd.seqOut('a', 5))).toBe(true);
          expect(colMap.C.equals(jd.rep(10, 5))).toBe(true);
      });

      it('only selects the first occurrence if there are duplicate ' +
        'column names and ignores null column names',
        function() {
          var colMap = exampleDf2.colMap();
          expect(Object.keys(colMap).length).toBe(2);
          expect('toString' in colMap).toBe(false);
          expect(colMap.A.equals(jd.seq(5))).toBe(true);
          expect(colMap.B.equals(jd.seq(10, 15))).toBe(true);
        }
      );
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

    describe('df.toString', function() {
      it('provides a customized description of the data frame', function() {
        expect(exampleDf1.toString()).toBe(
          'DataFrame[nRow:5, nCol:3, allDtype:null]'
        );
        expect(exampleDf2.toString()).toBe(
          'DataFrame[nRow:5, nCol:4, allDtype:number]'
        );
        expect(jd.df([]).toString()).toBe(
          'DataFrame[nRow:0, nCol:0, allDtype:null]'
        );
      });
    });
  });

  describe('conversion:', function() {

    describe('df.toObjArray', function() {
      it('behaves as expected in the typical case', function() {
        expect(exampleDf1.toObjArray()).toEqual([
          {A: 0, B: 'a', C: 10},
          {A: 1, B: 'b', C: 10},
          {A: 2, B: 'c', C: 10},
          {A: 3, B: 'd', C: 10},
          {A: 4, B: 'e', C: 10}
        ]);
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
          ]);
        }
      );

      it('returns an empty array when called on a 0-row data frame',
        function() {
          expect(jd.df([[], []], ['A', 'B']).toObjArray()).toEqual([]);
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

    describe('df.setNames', function() {
      it('behaves as expected for typical cases', function() {
        var df = exampleDf2.setNames(['A', 'B', 'C', 'D']);
        expect(df === exampleDf2).toBe(false);
        expect(df.names().equals(jd.seqOut('A', 4))).toBe(true);
        expect(df.resetNames().equals(exampleDf2.resetNames())).toBe(true);

        var df2 = exampleDf2.setNames(jd.seq(4));
        expect(df2.names().values).toEqual(['0', '1', '2', '3']);
      });

      it('throws an error if "names" has the wrong length', function() {
        expect(function() {
          exampleDf2.setNames(['A', 'B']);
        }).toThrowError(/length/);

        expect(function() {
          exampleDf2.setNames(jd.seq(2));
        }).toThrowError(/length/);

        expect(function() {
          exampleDf2.setNames([]);
        }).toThrowError(/length/);
      });
    });

    describe('df.resetNames', function() {
      it('returns a new data frame with column names reset', function() {
        var df = exampleDf2.resetNames();
        expect(df === exampleDf2).toBe(false);
        expect(df.names().values).toEqual(['c0', 'c1', 'c2', 'c3']);
        expect(df.nRow()).toBe(5);
        expect(df.nCol()).toBe(4);
        expect(df.c(0).equals(jd.seq(5))).toBe(true);
        expect(df.c(1).equals(jd.seq(5, 10))).toBe(true);
        expect(df.c(2).equals(jd.seq(10, 15))).toBe(true);
        expect(df.c(3).equals(jd.seq(15, 20))).toBe(true);
      });
    });
  });

  describe('subset selection / modification:', function() {

    describe('df.s', function() {
      it('returns original vectors if "rowSelect" is null or undefined',
        function() {
          var df1 = exampleDf1.s(null, ['A', 'B']);
          expect(df1.nCol()).toBe(2);
          expect(df1.c('A')).toBe(exampleDf1.c('A'));
          expect(df1.c('B')).toBe(exampleDf1.c('B'));

          var df2 = exampleDf1.s(undefined, 'C');
          expect(df2.nCol()).toBe(1);
          expect(df2.c('C')).toBe(exampleDf1.c('C'));
        }
      );

      describe('"colSelect" boolean indexing', function() {
        it('works for boolean vectors', function() {
          var colSelect = jd.vector([true, false, true]);
          expect(exampleDf1.s(null, colSelect).names().values).toEqual(
            ['A', 'C']
          );
        });

        it('works for boolean arrays', function() {
          expect(exampleDf1.s(null, [false, true, null]).names().values)
            .toEqual(['B']);
        });

        it('requires the vector or array to be the right length', function() {
          expect(function() {
            exampleDf1.s(null, [true]);
          }).toThrowError(/length/);

          expect(function() {
            exampleDf1.s(null, [true, false]);
          }).toThrowError(/length/);

          expect(function() {
            exampleDf1.s(null, jd.rep(true, 6));
          }).toThrowError(/length/);
        });
      });

      describe('"colSelect" integer indexing', function() {
        it('works for integer vectors', function() {
          var colSelect = jd.vector([1, 0, -2]);
          expect(exampleDf1.s(null, colSelect).names().values).toEqual(
            ['B', 'A', 'B']
          );

          expect(exampleDf1.s(null, jd.vector([2])).names().values)
            .toEqual(['C']);

          var subset = exampleDf1.s(null, jd.vector([], 'number'));
          expect(subset.nCol()).toBe(0);
          expect(subset.nRow()).toBe(0);
        });

        it('works for integer arrays', function() {
          expect(exampleDf1.s(null, [-2, 2, 1, 2]).names().values).toEqual(
            ['B', 'C', 'B', 'C']
          );

          expect(exampleDf1.s(null, [2]).names().values).toEqual(['C']);

          var subset = exampleDf1.s(null, []);
          expect(subset.nCol()).toBe(0);
          expect(subset.nRow()).toBe(0);
        });

        it('works for integer scalars', function() {
          expect(exampleDf1.s(null, 1).names().values).toEqual(['B']);
          expect(exampleDf1.s(null, -1).names().values).toEqual(['C']);
        });

        it('works for integer ranges', function() {
          var df = jd.df([1, 2, 3, 4, 5], ['a', 'b', 'c', 'd', 'e']);
          expect(df.s(null, jd.rng(1, 3)).names().values).toEqual(['b', 'c']);
          expect(df.s(null, jd.rng(1, 3, true)).names().values)
            .toEqual(['b', 'c', 'd']);
          expect(df.s(null, jd.rng(undefined, 3)).names().values)
            .toEqual(['a', 'b', 'c']);
          expect(df.s(null, jd.rng(2, undefined)).names().values)
            .toEqual(['c', 'd', 'e']);
          expect(df.s(null, jd.rng(1, -2)).names().values).toEqual(['b', 'c']);
          expect(df.s(null, jd.rng(-99, -2)).names().values)
            .toEqual(['a', 'b', 'c']);
          expect(df.s(null, jd.rng(-2, 99)).names().values).toEqual(['d', 'e']);
          expect(df.s(null, jd.rng(4, 4)).names().values).toEqual([]);
          expect(df.s(null, jd.rng(4, 4, true)).names().values).toEqual(['e']);
          expect(df.s(null, jd.rng(3, 1, true)).names().values).toEqual([]);
        });

        it('works for integer range concatenations', function() {
          var df = jd.df([1, 2, 3, 4, 5], ['a', 'b', 'c', 'd', 'e']);
          var rangeCat = jd.rngCat(
            jd.rng(-2, undefined), jd.rng(undefined, -2)
          );
          expect(df.s(null, rangeCat).names().values)
            .toEqual(['d', 'e', 'a', 'b', 'c']);

          var rangeCat2 = jd.rngCat(
            [0, 2], -1, jd.rng(1, 4), jd.rngCat(1, [2, 3])
          );
          expect(df.s(null, rangeCat2).names().values).toEqual(
            ['a', 'c', 'e', 'b', 'c', 'd', 'b', 'c', 'd']
          );
        });

        it('works for exclusions', function() {
          var boolVec = jd.vector([true, false, null]);
          expect(exampleDf1.s(null, jd.ex(boolVec.values)).names().values)
            .toEqual(['B', 'C']);
          expect(exampleDf1.s(null, boolVec.ex()).names().values)
            .toEqual(['B', 'C']);
          expect(exampleDf1.s(null, jd.ex(-1)).names().values)
            .toEqual(['A', 'B']);
          expect(exampleDf1.s(null, jd.ex([1, 2])).names().values)
            .toEqual(['A']);
          expect(exampleDf1.s(null, jd.seq(2).ex()).names().values)
            .toEqual(['C']);
          expect(exampleDf1.s(null, jd.seq(0).ex()).names().values)
            .toEqual(exampleDf1.names().values);
          expect(exampleDf1.s(null, jd.rng(0, -1, true).ex()).names().values)
            .toEqual([]);
          expect(exampleDf1.s(null, jd.rng(1, -1).ex()).names().values)
            .toEqual(['A', 'C']);
          var rangeCat = jd.rngCat(jd.rng(0, 1), jd.rng(2, undefined));
          expect(exampleDf1.s(null, rangeCat.ex()).names().values)
            .toEqual(['B']);
        });

        it('requires all integer indices to be within bounds', function() {
          expect(function() {
            exampleDf1.s(null, [0, 3]);
          }).toThrowError(/bounds/);

          expect(function() {
            exampleDf1.s(null, -4);
          }).toThrowError(/bounds/);
        });

        it('does not allow NaN indices', function() {
          expect(function() {
            exampleDf1.s(null, [0, 2, NaN]);
          }).toThrowError(/non-integer/);

          expect(function() {
            exampleDf1.s(null, jd.rng(1, NaN));
          }).toThrowError(/non-integer/);

          expect(function() {
            exampleDf1.s(null, jd.rngCat([0, 2], NaN));
          }).toThrowError(/non-integer/);
        });

        it('requires all indices to be integers', function() {
          expect(function() {
            exampleDf1.s(null, [0, 2, 1.5]);
          }).toThrowError(/non-integer/);

          expect(function() {
            exampleDf1.s(null, jd.rng(0, 1.5));
          }).toThrowError(/non-integer/);

          expect(function() {
            exampleDf1.s(null, jd.rngCat([0, 2], 1.5));
          }).toThrowError(/non-integer/);
        });
      });

      describe('"colSelect" ByDtype indexing', function() {
        it('behaves as expected', function() {
          expect(exampleDf1.s(null, jd.byDtype('number')).names().values)
            .toEqual(['A', 'C']);
          expect(exampleDf1.s(null, jd.byDtype(['string'])).names().values)
            .toEqual(['B']);
          expect(exampleDf1.s(null, jd.byDtype('object')).names().values)
            .toEqual([]);
          expect(
            exampleDf1.s(null, jd.byDtype(['object', 'string'])).names().values)
            .toEqual(['B']);
          expect(
            exampleDf1.s(null, jd.byDtype(['number', 'string'])).names().values)
            .toEqual(['A', 'B', 'C']);
          var dtypeVec = jd.vector(['object', 'string']);
          expect(exampleDf1.s(null, jd.byDtype(dtypeVec)).names().values)
            .toEqual(['B']);
        });

        it('can be reversed with exclusions', function() {
          expect(exampleDf1.s(null, jd.byDtype('number').ex()).names().values)
            .toEqual(['B']);
          expect(exampleDf1.s(null, jd.byDtype(['object']).ex()).names().values)
            .toEqual(['A', 'B', 'C']);
          expect(exampleDf1.s(null, jd.byDtype(['string', 'number']).ex())
            .names().values).toEqual([]);
        });
      });

      describe('"colSelect" column lookup', function() {
        var df1 = jd.df(jd.seq(5).values, jd.seqOut('a', 5));

        it('works for string vectors', function() {
          var colSelect = jd.vector(['c', 'a', 'd', 'a']);
          expect(df1.s(null, colSelect).names().values)
            .toEqual(['c', 'a', 'd', 'a']);

          expect(df1.s(null, jd.vector(['b'])).names().values).toEqual(['b']);

          var subset = df1.s(null, jd.vector([], 'string'));
          expect(subset.nCol()).toBe(0);
          expect(subset.nRow()).toBe(0);
        });

        it('works for string arrays', function() {
          expect(df1.s(null, ['c', 'a', 'd', 'a']).names().values)
            .toEqual(['c', 'a', 'd', 'a']);

          expect(df1.s(null, ['b']).names().values).toEqual(['b']);
        });

        it('works for string scalars', function() {
          expect(df1.s(null, 'e').names().values).toEqual(['e']);
        });

        it('works for string ranges', function() {
          var df2 = jd.df(jd.seq(5).values, ['a', 'b', 'a', 'b', 'c']);

          expect(df2.s(null, jd.rng('a', 'b')).names().values)
            .toEqual(['a', 'b', 'a', 'b']);
          expect(df2.s(null, jd.rng('a', 'b', false)).names().values)
            .toEqual(['a']);
          expect(df2.s(null, jd.rng('b', 'a')).names().values)
            .toEqual(['b', 'a']);
          expect(df2.s(null, jd.rng('b', 'a', false)).names().values)
            .toEqual([]);
          expect(df2.s(null, jd.rng('c', undefined)).names().values)
            .toEqual(['c']);
          expect(df2.s(null, jd.rng(undefined, 'b')).names().values)
            .toEqual(['a', 'b', 'a', 'b']);
          expect(df2.s(null, jd.rng(undefined, 'b', false)).names().values)
            .toEqual(['a']);
        });

        it('works for string range concatenations', function() {
          var rangeCat = jd.rngCat(
            jd.rng('d', undefined), jd.rng(undefined, 'c')
          );
          expect(df1.s(null, rangeCat).names().values)
            .toEqual(['d', 'e', 'a', 'b', 'c']);

          var rangeCat2 = jd.rngCat(
            ['a', 'c'], 'e', jd.rng('b', 'd'), jd.rngCat('b', ['c', 'd'])
          );
          expect(df1.s(null, rangeCat2).names().values).toEqual(
            ['a', 'c', 'e', 'b', 'c', 'd', 'b', 'c', 'd']
          );
        });

        it('works for exclusions', function() {
          expect(df1.s(null, jd.ex('d')).names().values)
            .toEqual(['a', 'b', 'c', 'e']);
          expect(df1.s(null, jd.ex(['d', 'e'])).names().values)
            .toEqual(['a', 'b', 'c']);
          expect(df1.s(null, jd.seqOut('a', 3).ex()).names().values)
            .toEqual(['d', 'e']);
          expect(df1.s(null, jd.vector([], 'string').ex()).names().values)
            .toEqual(['a', 'b', 'c', 'd', 'e']);
          expect(df1.s(null, jd.rng('a', 'e').ex()).names().values)
            .toEqual([]);
          expect(df1.s(null, jd.rng('b', 'd').ex()).names().values)
            .toEqual(['a', 'e']);
          var rangeCat = jd.rngCat(jd.rng('a', 'b'), jd.rng('d', 'e'));
          expect(df1.s(null, rangeCat.ex()).names().values).toEqual(['c']);
        });

        it('retrieves all occurrences of duplicate column names', function() {
          var df2 = jd.df(jd.seq(4).values, ['a', 'a', 'b', 'c']);

          var subset1 = df2.s(null, 'a');
          expect(subset1.names().values).toEqual(['a', 'a']);
          expect(subset1.at(0, 0)).toBe(0);
          expect(subset1.at(0, 1)).toBe(1);

          var subset2 = df2.s(null, ['a', 'b', 'a']);
          expect(subset2.names().values).toEqual(['a', 'a', 'b', 'a', 'a']);
          expect(subset2.at(0, 0)).toBe(0);
          expect(subset2.at(0, 1)).toBe(1);
          expect(subset2.at(0, 2)).toBe(2);
          expect(subset2.at(0, 3)).toBe(0);
          expect(subset2.at(0, 4)).toBe(1);
        });

        it('treats null column name lookup like any other string', function() {
          var df2 = jd.df(jd.seq(5).values, ['a', 'b', null, 'c', null]);

          var subset1 = df2.s(null, [null]);
          expect(subset1.names().values).toEqual([null, null]);
          expect(subset1.at(0, 0)).toBe(2);
          expect(subset1.at(0, 1)).toBe(4);

          var subset2 = df2.s(null, [null, 'b', null]);
          expect(subset2.names().values)
            .toEqual([null, null, 'b', null, null]);
          expect(subset2.at(0, 0)).toBe(2);
          expect(subset2.at(0, 1)).toBe(4);
          expect(subset2.at(0, 2)).toBe(1);
          expect(subset2.at(0, 3)).toBe(2);
          expect(subset2.at(0, 4)).toBe(4);

          var subset3 = df2.s(null, jd.rng(null, 'c'));
          expect(subset3.names().values).toEqual([null, 'c']);
          expect(subset3.at(0, 0)).toBe(2);
          expect(subset3.at(0, 1)).toBe(3);

          var subset4 = df2.s(null, jd.rng('c', null));
          expect(subset4.names().values).toEqual(['c', null]);
          expect(subset4.at(0, 0)).toBe(3);
          expect(subset4.at(0, 1)).toBe(4);
        });

        it('throws an error for any unrecognized column names', function() {
          expect(function() {
            df1.s(null, 'colZ');
          }).toThrowError(/colZ/);

          expect(function() {
            df1.s(null, ['a', 'b', 'colZ']);
          }).toThrowError(/colZ/);

          expect(function() {
            df1.s(null, jd.rng('b', 'colZ'));
          }).toThrowError(/colZ/);
        });
      });

      describe('"colSelect" mixed integer / column name indexing', function() {
        var df1 = jd.df(jd.seq(5).values, jd.seqOut('a', 5));

        it('is allowed', function() {
          expect(df1.s(null, ['a', 1, 'c', -2]).names().values)
            .toEqual(['a', 'b', 'c', 'd']);

          expect(df1.s(null, jd.rng('a', -2, false)).names().values)
            .toEqual(['a', 'b', 'c']);

          expect(df1.s(null, jd.rng(2, 'd', true)).names().values)
            .toEqual(['c', 'd']);

          var rangeCat = jd.rngCat(jd.rng('a', 'b'), -1);
          expect(df1.s(null, rangeCat).names().values)
            .toEqual(['a', 'b', 'e']);
        });

        it('does not permit dtypes other than number and string', function() {
          expect(function() {
            df1.s(null, ['a', 1, true]);
          }).toThrowError(/true/);
        });
      });

      it('returns all columns if "colSelect" is null or undefined', function() {
        var df1 = exampleDf1.s([1, 2], null);
        expect(df1.names().values).toEqual(['A', 'B', 'C']);
        expect(df1.nRow()).toBe(2);

        var df2 = exampleDf1.s([0, 3, 0, 4]);
        expect(df2.names().values).toEqual(['A', 'B', 'C']);
        expect(df2.nRow()).toBe(4);
      });

      it('returns a data frame even when selecting only 1 or 0 columns, ' +
        'rows, or elements',
        function() {
          var df1 = exampleDf1.s(null, 'A');
          expect(df1.nRow()).toBe(5);
          expect(df1.nCol()).toBe(1);

          var df2 = exampleDf1.s(0, null);
          expect(df2.nRow()).toBe(1);
          expect(df2.nCol()).toBe(3);

          var df3 = exampleDf1.s(0, 0);
          expect(df3.nRow()).toBe(1);
          expect(df3.nCol()).toBe(1);

          var df4 = exampleDf1.s([], null);
          expect(df4.nRow()).toBe(0);
          expect(df4.nCol()).toBe(3);

          var df5 = exampleDf1.s(null, []);
          expect(df5.nRow()).toBe(0);
          expect(df5.nCol()).toBe(0);
        }
      );
    });

    describe('df.sMod', function() {
      it('behaves as expected with "values" a data frame', function() {
        var dfSub = jd.df([[-1, -2], jd.rep(0, 2)]);
        var df1 = exampleDf1.sMod(jd.rng(3), ['A', 'C'], dfSub);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.s(jd.seq(3), ['A', 'C']).equals(
          exampleDf1.s(jd.seq(3), ['A', 'C']))).toBe(true);
        expect(df1.s(jd.rng(3), ['A', 'C']).resetNames().equals(dfSub))
          .toBe(true);
        expect(df1.c('B').equals(exampleDf1.c('B'))).toBe(true);
      });

      it('behaves as expected with "values" a scalar', function() {
        var df1 = exampleDf1.sMod(jd.rng(3), ['A', 'C'], null);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.s(jd.seq(3), ['A', 'C']).equals(
          exampleDf1.s(jd.seq(3), ['A', 'C']))).toBe(true);
        expect(df1.c('A').s(jd.rng(3)).values).toEqual([NaN, NaN]);
        expect(df1.c('C').s(jd.rng(3)).values).toEqual([NaN, NaN]);
        expect(df1.c('B').equals(exampleDf1.c('B'))).toBe(true);

        var df2 = exampleDf1.sMod(null, 'B', 9);
        expect(df2.nRow()).toBe(5);
        expect(df2.nCol()).toBe(3);
        expect(df2.c('A').equals(exampleDf1.c('A'))).toBe(true);
        expect(df2.c('C').equals(exampleDf1.c('C'))).toBe(true);
        expect(df2.c('B').equals(jd.rep(9, 5))).toBe(true);
      });

      it('works as expected for empty selection', function() {
        var df1 = exampleDf1.sMod([], [], 100);
        expect(df1.equals(exampleDf1)).toBe(true);
      });

      it('works as expected when selecting everything', function() {
        var dfSub = exampleDf2.s(null, jd.seq(3));
        var df1 = exampleDf1.sMod(null, null, dfSub);
        expect(df1.names().values).toEqual(['A', 'B', 'C']);
        expect(df1.resetNames().equals(dfSub.resetNames())).toBe(true);
      });

      it('works for modification of a single cell', function() {
        var df1 = exampleDf1.sMod(0, 'C', -1);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.s(null, ['A', 'B']).equals(
          exampleDf1.s(null, ['A', 'B']))).toBe(true);
        expect(df1.c('C').values).toEqual([-1, 10, 10, 10, 10]);

        var df2 = exampleDf1.sMod(0, 'C', jd.df([-1]));
        expect(df2.equals(df1)).toBe(true);
      });

      it('uses the last modification if a row is selected multiple times',
        function() {
          var vector = jd.rep(0, 3);
          var df = jd.df([vector, vector]);
          var dfMod = df.sMod([1, 2, 1], 0, jd.df([jd.seq(3)]));
          expect(dfMod.c(0).values).toEqual([0, 2, 1]);
          expect(dfMod.c(1).values).toEqual([0, 0, 0]);
        }
      );

      it('throws an error if "colSelect" selects columns more than once',
        function() {
          expect(function() {
            exampleDf1.sMod(null, [0, 1, 0], 100);
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error for "values" data frame with wrong dimensions',
        function() {
          expect(function() {
            exampleDf1.sMod(jd.seq(3), jd.seq(2), exampleDf1);
          }).toThrowError(/dimensions/);

          expect(function() {
            exampleDf1.sMod(jd.seq(3), jd.seq(2), jd.df([]));
          }).toThrowError(/dimensions/);
        }
      );
    });

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

    describe('df.cMod', function() {
      it('behaves as expected for integer indexing', function() {
        var df1 = exampleDf1.cMod(1, jd.seq(100, 105));
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.s(null, jd.ex(1)).equals(exampleDf1.s(null, jd.ex(1))))
          .toBe(true);
        expect(df1.c('B').equals(jd.seq(100, 105))).toBe(true);

        // Check negative index also
        var df2 = exampleDf1.cMod(-1, null);
        expect(df2.nRow()).toBe(5);
        expect(df2.nCol()).toBe(3);
        expect(df2.s(null, jd.ex(-1)).equals(exampleDf1.s(null, jd.ex(-1))))
          .toBe(true);
        expect(df2.c('C').equals(jd.repNa(5, 'object'))).toBe(true);
      });

      it('throws an error for numbers out of bounds', function() {
        expect(function() {
          exampleDf1.cMod(-4, null);
        }).toThrowError(/bounds/);

        expect(function() {
          exampleDf1.cMod(3, null);
        }).toThrowError(/bounds/);
      });

      it('replaces column when column name lookup succeeds', function() {
        var df1 = exampleDf1.cMod('B', [true, false, true, false, true]);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.s(null, jd.ex('B')).equals(exampleDf1.s(null, jd.ex('B'))))
          .toBe(true);
        expect(df1.c(1).values).toEqual([true, false, true, false, true]);

        var df2 = exampleDf2.cMod(null, NaN);
        expect(df2.nRow()).toBe(5);
        expect(df2.nCol()).toBe(4);
        expect(df2.s(null, jd.ex(1)).equals(exampleDf2.s(null, jd.ex(1))))
          .toBe(true);
        expect(df2.c(null).equals(jd.repNa(5, 'number'))).toBe(true);
      });

      it('selects the first occurrence for duplicate names', function() {
        var df1 = exampleDf2.cMod('A', -1);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(4);
        expect(df1.s(null, jd.ex(0)).equals(exampleDf2.s(null, jd.ex(0))))
          .toBe(true);
        expect(df1.c(0).equals(jd.rep(-1, 5))).toBe(true);
      });

      it('inserts a new column if column name lookup fails', function() {
        var df1 = exampleDf1.cMod('D', 'new');
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(4);
        expect(df1.s(null, jd.seq(3)).equals(exampleDf1)).toBe(true);
        expect(df1.c(3).equals(jd.rep('new', 5))).toBe(true);
      });

      it('throws an error if "colValue" has incompatible length', function() {
        expect(function() {
          exampleDf1.cMod(1, jd.seq(4));
        }).toThrowError(/length/);

        expect(function() {
          exampleDf1.cMod(1, jd.vector([]));
        }).toThrowError(/length/);
      });
    });

    describe('df.insertCol', function() {
      it('inserts a new column at "index" if given', function() {
        var df1 = exampleDf1.insertCol('Z', jd.seq(100, 105), 0);
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(4);
        expect(df1.names().values).toEqual(['Z', 'A', 'B', 'C']);
        expect(df1.s(null, jd.rng(1)).equals(exampleDf1)).toBe(true);
        expect(df1.c('Z').equals(jd.seq(100, 105))).toBe(true);

        expect(exampleDf1.insertCol('Z', jd.seq(100, 105), -100).equals(df1))
          .toBe(true);

        var df2 = exampleDf1.insertCol('Z', null, 3);
        expect(df2.nRow()).toBe(5);
        expect(df2.nCol()).toBe(4);
        expect(df2.names().values).toEqual(['A', 'B', 'C', 'Z']);
        expect(df2.s(null, jd.seq(3)).equals(exampleDf1)).toBe(true);
        expect(df2.c('Z').equals(jd.repNa(5, 'object'))).toBe(true);

        expect(exampleDf1.insertCol('Z', null, 100).equals(df2)).toBe(true);

        var df3 = exampleDf1.insertCol('Z', [1, 4, 9, 16, 25], -2);
        expect(df3.nRow()).toBe(5);
        expect(df3.nCol()).toBe(4);
        expect(df3.names().values).toEqual(['A', 'Z', 'B', 'C']);
        expect(df3.s(null, jd.ex(1)).equals(exampleDf1)).toBe(true);
        expect(df3.c('Z').values).toEqual([1, 4, 9, 16, 25]);
      });

      it('appends to the end of the data frame by default', function() {
        var df1 = exampleDf1.insertCol('D', 'new');
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(4);
        expect(df1.names().values).toEqual(['A', 'B', 'C', 'D']);
        expect(df1.s(null, jd.seq(3)).equals(exampleDf1)).toBe(true);
        expect(df1.c('D').equals(jd.rep('new', 5))).toBe(true);
      });

      it('throws an error if "colValue" has incompatible length', function() {
        expect(function() {
          exampleDf1.insertCol('newCol', jd.seq(4));
        }).toThrowError(/length/);

        expect(function() {
          exampleDf1.insertCol('newCol', jd.vector([]));
        }).toThrowError(/length/);
      });

      it('throws an error if "index" is invalid', function() {
        expect(function() {
          exampleDf1.insertCol('newCol', jd.seq(5), jd.seq(10));
        }).toThrowError(/scalar/);

        expect(function() {
          exampleDf1.insertCol('newCol', jd.seq(5), 'invalid');
        }).toThrowError(/integer/);

        expect(function() {
          exampleDf1.insertCol('newCol', jd.seq(5), NaN);
        }).toThrowError(/integer/);
      });
    });

    describe('df.at', function() {
      it('behaves as expected for valid "i" and "j" values', function() {
        expect(exampleDf1.at(0, 1)).toBe('a');
        expect(exampleDf1.at([2], [-1])).toBe(10);
        expect(exampleDf1.at(jd.vector([-1]), jd.vector(['A']))).toBe(4);

        expect(exampleDf2.at(0, 'A')).toBe(0);
        expect(exampleDf2.at(0, null)).toBe(5);
      });

      it('throws an error for non-integer "i" values', function() {
        expect(function() {
          exampleDf1.at('invalid', 0);
        }).toThrowError(/integer/);

        expect(function() {
          exampleDf1.at(1.5, 0);
        }).toThrowError(/integer/);

        expect(function() {
          exampleDf1.at(NaN, 0);
        }).toThrowError(/integer/);
      });

      it('throws an error for "j" values that aren\'t integers or strings',
        function() {
          expect(function() {
            exampleDf1.at(0, true);
          }).toThrowError(/integer/);

          expect(function() {
            exampleDf1.at(0, 1.5);
          }).toThrowError(/integer/);

          expect(function() {
            exampleDf1.at(0, NaN);
          }).toThrowError(/integer/);
        }
      );

      it('throws an error for "i" or "j" values out of bounds', function() {
        expect(function() {
          exampleDf1.at(5, 0);
        }).toThrowError(/bounds/);

        expect(function() {
          exampleDf1.at(0, -4);
        }).toThrowError(/bounds/);
      });

      it('throws an error if "i" or "j" aren\'t scalar / length 1', function() {
        expect(function() {
          exampleDf1.at([0, 1], 0);
        }).toThrowError(/length/);

        expect(function() {
          exampleDf1.at(0, jd.seq(2));
        }).toThrowError(/length/);
      });

      it('throws an error if string "j" is not a valid column name',
        function() {
          expect(function() {
            exampleDf1.at(0, 'colZ');
          }).toThrowError(/colZ/);
        }
      );
    });

    describe('df.head', function() {
      var df1 = jd.df([jd.seq(10), 10], ['A', 'B']);

      it('behaves as expected for nonnegative "n"', function() {
        expect(df1.head(3).equals(df1.s(jd.seq(3)))).toBe(true);
        expect(df1.head(3).c('A').equals(jd.seq(3))).toBe(true);
        expect(df1.head(1).equals(df1.s(jd.seq(1)))).toBe(true);
        expect(df1.head(10).equals(df1)).toBe(true);
        expect(df1.head(100).equals(df1)).toBe(true);
        expect(df1.head(0).equals(df1.s([]))).toBe(true);
      });

      it('behaves as expected for negative "n"', function() {
        expect(df1.head(-7).equals(df1.s(jd.seq(3)))).toBe(true);
        expect(df1.head(-7).c('A').equals(jd.seq(3))).toBe(true);
        expect(df1.head(-9).equals(df1.s(jd.seq(1)))).toBe(true);
        expect(df1.head(-10).equals(df1.s([]))).toBe(true);
        expect(df1.head(-100).equals(df1.s([]))).toBe(true);
        expect(df1.head(-100).c('A').equals(jd.seq(0))).toBe(true);
      });

      it('defaults to n = 6', function() {
        expect(df1.head().equals(df1.s(jd.seq(6)))).toBe(true);
      });

      it('throws an error if "n" is not an integer', function() {
        expect(function() {
          df1.head('string');
        }).toThrowError(/integer/);

        expect(function() {
          df1.head(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          df1.head(NaN);
        }).toThrowError(/integer/);
      });
    });

    describe('df.tail', function() {
      var df1 = jd.df([jd.seq(10), 10], ['A', 'B']);

      it('behaves as expected for nonnegative "n"', function() {
        expect(df1.tail(3).equals(df1.s(jd.rng(-3)))).toBe(true);
        expect(df1.tail(3).c('A').equals(jd.seq(7, 10))).toBe(true);
        expect(df1.tail(1).equals(df1.s(jd.rng(-1)))).toBe(true);
        expect(df1.tail(10).equals(df1)).toBe(true);
        expect(df1.tail(100).equals(df1)).toBe(true);
        expect(df1.tail(0).equals(df1.s([]))).toBe(true);
      });

      it('behaves as expected for negative "n"', function() {
        expect(df1.tail(-7).equals(df1.s(jd.rng(-3)))).toBe(true);
        expect(df1.tail(-7).c('A').equals(jd.seq(7, 10))).toBe(true);
        expect(df1.tail(-9).equals(df1.s(jd.rng(-1)))).toBe(true);
        expect(df1.tail(-10).equals(df1.s([]))).toBe(true);
        expect(df1.tail(-100).equals(df1.s([]))).toBe(true);
        expect(df1.tail(-100).c('A').equals(jd.seq(0))).toBe(true);
      });

      it('defaults to n = 6', function() {
        expect(df1.tail().equals(df1.s(jd.seq(4, 10)))).toBe(true);
      });

      it('throws an error if "n" is not an integer', function() {
        expect(function() {
          df1.tail('string');
        }).toThrowError(/integer/);

        expect(function() {
          df1.tail(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          df1.tail(NaN);
        }).toThrowError(/integer/);
      });
    });
  });

});
