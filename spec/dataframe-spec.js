
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

    describe('df.pack', function() {
      it('behaves as expected', function() {
        var roundTripDf1 = jd.unpack(JSON.parse(
          JSON.stringify(exampleDf1.pack())));
        expect(exampleDf1.equals(roundTripDf1)).toBe(true);

        var roundTripDf2 = jd.unpack(JSON.parse(
          JSON.stringify(exampleDf2.pack())));
        expect(exampleDf2.equals(roundTripDf2)).toBe(true);
      });
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

  describe('missing values:', function() {
    var naTestDf = jd.df([
      [ 0,  NaN,    2,  3,   NaN],
      ['a', 'b', null, 'd', null]
    ], ['A', 'B']);

    describe('df.isNa', function() {
      it('returns a boolean data frame indicating missing values', function() {
        var expectedDf = jd.df([
          [false, true, false, false, true],
          [false, false, true, false, true]
        ], ['A', 'B']);
        expect(naTestDf.isNa().equals(expectedDf)).toBe(true);
      });
    });

    describe('df.dropNa', function() {
      it('drops all rows with any missing values', function() {
        var expectedDf = jd.df([
          [0, 3],
          ['a', 'd']
        ], ['A', 'B']);
        expect(naTestDf.dropNa().equals(expectedDf)).toBe(true);
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
          var selector1 = [
            jd.rng(-2, undefined), jd.rng(undefined, -2)
          ];
          expect(df.s(null, selector1).names().values)
            .toEqual(['d', 'e', 'a', 'b', 'c']);

          var selector2 = [
            [0, 2], -1, jd.rng(1, 4), [1, [2, 3]]
          ];
          expect(df.s(null, selector2).names().values).toEqual(
            ['a', 'c', 'e', 'b', 'c', 'd', 'b', 'c', 'd']
          );

          var selector3 = [jd.rng(1).ex(), jd.rng(2).ex()];
          expect(df.s(null, selector3).names().values).toEqual(
            ['a', 'a', 'b']
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
          var selector = jd.ex([jd.rng(0, 1), jd.rng(2, undefined)]);
          expect(exampleDf1.s(null, selector).names().values)
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
            exampleDf1.s(null, [[0, 2], NaN]);
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
            exampleDf1.s(null, [[0, 2], 1.5]);
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

          var selector = [jd.byDtype('string'), jd.byDtype('string').ex()];
          expect(exampleDf1.s(null, selector).names().values)
            .toEqual(['B', 'A', 'C']);
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
          var selector1 = [
            jd.rng('d', undefined), jd.rng(undefined, 'c')
          ];
          expect(df1.s(null, selector1).names().values)
            .toEqual(['d', 'e', 'a', 'b', 'c']);

          var selector2 = [
            ['a', 'c'], 'e', jd.rng('b', 'd'), ['b', ['c', 'd']]
          ];
          expect(df1.s(null, selector2).names().values).toEqual(
            ['a', 'c', 'e', 'b', 'c', 'd', 'b', 'c', 'd']
          );

          var selector3 = [
            jd.rng('b').ex(), jd.rng('c').ex()
          ];
          expect(df1.s(null, selector3).names().values).toEqual(
            ['a', 'a', 'b']
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
          var selector = jd.ex([jd.rng('a', 'b'), jd.rng('d', 'e')]);
          expect(df1.s(null, selector).names().values).toEqual(['c']);
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

          var selector = [jd.rng('a', 'b'), -1];
          expect(df1.s(null, selector).names().values)
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

      it('preserves column dtypes even if only missing values are selected',
        function() {
          var exampleDf3 = jd.dfFromMatrix([
            [0, 'a', true],
            [1, 'b', false],
            [2, 'c', true],
            [NaN, null, null]
          ]);
          var df = exampleDf3.s(-1);
          expect(df.nRow()).toBe(1);
          expect(df.nCol()).toBe(3);
          expect(df.toMatrix()[0]).toEqual([NaN, null, null]);
          expect(df.dtypes().c('dtype').values).toEqual(
            ['number', 'string', 'boolean']
          );
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

      it('throws an error if column name lookup fails', function() {
        expect(function() {
          exampleDf1.cMod('colZ', 'new');
        }).toThrowError(/colZ/);
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

    describe('df.locAt', function() {
      it('behaves as expected given valid inputs', function() {
        expect(exampleDf1.locAt('B', 'c', 'A')).toBe(2);
        expect(exampleDf1.locAt(0, 3, 1)).toBe('d');
      });

      it('selects the first occurrence of the "lookupKey"', function() {
        var dupDf = exampleDf1.sMod(jd.rng(-2), 'B', 'b');
        expect(exampleDf1.locAt('B', 'b', 'A')).toBe(1);
      });

      it('throws an error if lookup fails', function() {
        expect(function() {
          exampleDf1.locAt('B', 'missing key', 'A');
        }).toThrowError(/no match for lookup key/);
      });

      it('throws an error for invalid "lookupCols"', function() {
        expect(function() {
          exampleDf1.locAt(['A', 'B'], [1, 'b'], 'C');
        }).toThrowError(/single scalar/);
      });

      it('throws an error for invalid "colSelect"', function() {
        expect(function() {
          exampleDf1.locAt('B', 'c', 'colZ');
        }).toThrowError(/colZ/);
      });
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

  describe('column / row iteration:', function() {

    describe('df.mapCols', function() {
      it('maps all columns when "colSelect" is unspecified', function() {
        var df1 = exampleDf2.mapCols(function(colVec) {
          return colVec.mul(-1);
        });
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(4);
        expect(df1.names().equals(exampleDf2.names())).toBe(true);
        expect(df1.c(0).equals(exampleDf2.c(0).mul(-1))).toBe(true);
        expect(df1.c(1).equals(exampleDf2.c(1).mul(-1))).toBe(true);
        expect(df1.c(2).equals(exampleDf2.c(2).mul(-1))).toBe(true);
        expect(df1.c(3).equals(exampleDf2.c(3).mul(-1))).toBe(true);
      });

      it('only maps selected columns when given "colSelect"', function() {
        var df1 = exampleDf1.mapCols([0, 2], function(colVec) {
          return colVec.add(100);
        });
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(2);
        expect(df1.names().values).toEqual(['A', 'C']);
        expect(df1.c(0).equals(jd.seq(100, 105))).toBe(true);
        expect(df1.c(1).equals(jd.rep(110, 5))).toBe(true);
      });

      it('works to aggregate when returning a scalar from "func"', function() {
        var df1 = exampleDf1.mapCols(['A', 'C'], function(colVec) {
          return colVec.mean();
        });
        expect(df1.nRow()).toBe(1);
        expect(df1.nCol()).toBe(2);
        expect(df1.names().values).toEqual(['A', 'C']);
        expect(df1.at(0, 'A')).toBe(2);
        expect(df1.at(0, 'C')).toBe(10);

        var df2 = exampleDf2.mapCols(function(colVec) {
          return colVec.mean();
        });
        expect(df2.nRow()).toBe(1);
        expect(df2.nCol()).toBe(4);
        expect(df2.names().equals(exampleDf2.names())).toBe(true);
        expect(df2.at(0, 0)).toBe(2);
        expect(df2.at(0, 1)).toBe(7);
        expect(df2.at(0, 2)).toBe(12);
        expect(df2.at(0, 3)).toBe(17);
      });

      it('passes "colName", "colIndex", and "resultIndex" to "func"',
        function() {
          var df1 = exampleDf1.mapCols(['A', 'C'],
            function(colVector, colName, colIndex, resultIndex) {
              return colName;
            }
          );
          expect(df1.nRow()).toBe(1);
          expect(df1.nCol()).toBe(2);
          expect(df1.names().values).toEqual(['A', 'C']);
          expect(df1.at(0, 'A')).toBe('A');
          expect(df1.at(0, 'C')).toBe('C');

          var df2 = exampleDf1.mapCols(['A', 'C', 'A'],
            function(colVector, colName, colIndex, resultIndex) {
              return [colIndex, resultIndex];
            }
          );
          expect(df2.nRow()).toBe(2);
          expect(df2.nCol()).toBe(3);
          expect(df2.names().values).toEqual(['A', 'C', 'A']);
          expect(df2.c(0).values).toEqual([0, 0]);
          expect(df2.c(1).values).toEqual([2, 1]);
          expect(df2.c(2).values).toEqual([0, 2]);
        }
      );

      it('returns a 0-column data frame if "colSelect" is empty', function() {
        var df1 = exampleDf1.mapCols([], function(c) { return c; });
        expect(df1.nRow()).toBe(0);
        expect(df1.nCol()).toBe(0);
        expect(df1.equals(jd.df([]))).toBe(true);
      });

      it('throws an error if returned columns have inconsistent lengths',
        function() {
          expect(function() {
            exampleDf2.mapCols(function(colVec, colName, colIndex) {
              return jd.seq(colIndex + 1);
            });
          }).toThrowError(/lengths/);
        }
      );

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          exampleDf1.mapCols();
        }).toThrowError(/function/);

        expect(function() {
          exampleDf1.mapCols([0, 1]);
        }).toThrowError(/function/);

        expect(function() {
          exampleDf1.mapCols(jd.byDtype('number'), 'not a function');
        }).toThrowError(/function/);
      });
    });

    describe('df.updateCols', function() {
      it('only alters selected columns using "func"', function() {
        var df1 = exampleDf1.updateCols('B', function(colVec) {
          return colVec.nChar();
        });
        expect(df1.nRow()).toBe(5);
        expect(df1.nCol()).toBe(3);
        expect(df1.names().equals(exampleDf1.names())).toBe(true);
        expect(df1.c('A').equals(exampleDf1.c('A'))).toBe(true);
        expect(df1.c('B').equals(jd.rep(1, 5))).toBe(true);
        expect(df1.c('C').equals(exampleDf1.c('C'))).toBe(true);
      });

      it('behaves just like "mapCols" when "colSelect" is unspecified',
        function() {
          var df1 = exampleDf1.updateCols(function() { return jd.seq(5); });
          var df2 = exampleDf1.mapCols(function() { return jd.seq(5); });
          expect(df1.equals(df2)).toBe(true);
          expect(df1.c(0).equals(jd.seq(5))).toBe(true);
          expect(df1.c(1).equals(jd.seq(5))).toBe(true);
          expect(df1.c(2).equals(jd.seq(5))).toBe(true);
        }
      );

      it('passes "colName", "colIndex", and "resultIndex" to "func"',
        function() {
          var df1 = exampleDf2.updateCols([3, 2],
            function(colVector, colName, colIndex, resultIndex) {
              return [colName, colIndex, resultIndex, -1, -1];
            }
          );
          expect(df1.nRow()).toBe(5);
          expect(df1.nCol()).toBe(4);
          expect(df1.names().equals(exampleDf2.names())).toBe(true);
          expect(df1.s(null, jd.rng(0, 2)).equals(
            exampleDf2.s(null, jd.rng(0, 2)))
          ).toBe(true);
          expect(df1.c(2).values).toEqual(['B', 2, 1, -1, -1]);
          expect(df1.c(3).values).toEqual(['A', 3, 0, -1, -1]);
        }
      );

      it('leaves the data frame unchanged if "colSelect" is empty', function() {
        var df1 = exampleDf2.updateCols([], function(c) { return c; });
        expect(df1.equals(exampleDf2)).toBe(true);
      });

      it('throws an error if "colSelect" selects columns more than once',
        function() {
          expect(function() {
            exampleDf1.updateCols([0, 1, 0], function(c) { return c; });
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error if returned columns have length different from ' +
        'the number of rows in this data frame',
        function() {
          expect(function() {
            exampleDf1.updateCols(['A', 'C'], function() { return jd.seq(3); });
          }).toThrowError(/lengths/);
        }
      );

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          exampleDf1.updateCols();
        }).toThrowError(/function/);

        expect(function() {
          exampleDf1.updateCols([0, 1]);
        }).toThrowError(/function/);

        expect(function() {
          exampleDf1.updateCols(jd.byDtype('number'), 'not a function');
        }).toThrowError(/function/);
      });
    });

    describe('df.mapRowObjects', function() {
      it('behaves as expected for standard usage', function() {
        var arr1 = exampleDf1.mapRowObjects(function(obj) {
          return obj.B;
        });
        expect(arr1).toEqual(['a', 'b', 'c', 'd', 'e']);

        var arr2 = exampleDf1.mapRowObjects(function(obj, index) {
          return index;
        });
        expect(arr2).toEqual([0, 1, 2, 3, 4]);

        var thisArg = {adder: 100};
        var arr3 = exampleDf1.mapRowObjects(function(obj, index, thisArg) {
          return this.adder + obj.A;
        }, thisArg);
        expect(arr3).toEqual([100, 101, 102, 103, 104]);
      });

      it('returns an empty array for 0-row data frames', function() {
        var arr1 = exampleDf1.s([]).mapRowObjects(function(x) { return x; });
        expect(arr1).toEqual([]);
      });

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          exampleDf2.mapRowObjects();
        }).toThrowError(/function/);

        expect(function() {
          exampleDf2.mapRowObjects('not a function');
        }).toThrowError(/function/);
      });
    });

    describe('df.mapRowArrays', function() {
      it('behaves as expected for standard usage', function() {
        var arr1 = exampleDf1.mapRowArrays(function(array) {
          return array[1];
        });
        expect(arr1).toEqual(['a', 'b', 'c', 'd', 'e']);

        var arr2 = exampleDf1.mapRowArrays(function(array, index) {
          return index;
        });
        expect(arr2).toEqual([0, 1, 2, 3, 4]);

        var thisArg = {adder: 100};
        var arr3 = exampleDf1.mapRowArrays(function(array, index, thisArg) {
          return this.adder + array[0];
        }, thisArg);
        expect(arr3).toEqual([100, 101, 102, 103, 104]);
      });

      it('returns an empty array for 0-row data frames', function() {
        var arr1 = exampleDf1.s([]).mapRowArrays(function(x) { return x; });
        expect(arr1).toEqual([]);
      });

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          exampleDf2.mapRowArrays();
        }).toThrowError(/function/);

        expect(function() {
          exampleDf2.mapRowArrays('not a function');
        }).toThrowError(/function/);
      });
    });

    describe('df.mapRowVectors', function() {
      it('behaves as expected for standard usage', function() {
        var arr1 = exampleDf2.mapRowVectors(function(vector) {
          return vector.mean();
        });
        expect(arr1).toEqual([7.5, 8.5, 9.5, 10.5, 11.5]);

        var arr2 = exampleDf2.mapRowVectors(function(array, index) {
          return index;
        });
        expect(arr2).toEqual([0, 1, 2, 3, 4]);

        var thisArg = {adder: 100};
        var arr3 = exampleDf2.mapRowVectors(function(vector, index, thisArg) {
          return this.adder + vector.at(0);
        }, thisArg);
        expect(arr3).toEqual([100, 101, 102, 103, 104]);
      });

      it('returns an empty array for 0-row data frames', function() {
        var arr1 = exampleDf2.s([]).mapRowVectors(function(x) { return x; });
        expect(arr1).toEqual([]);
      });

      it('throws an error if "df.allDtype" is null', function() {
        expect(function() {
          exampleDf1.mapRowVectors(function(vector, index) {
            return index;
          });
        }).toThrowError(/allDtype/);
      });

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          exampleDf2.mapRowVectors();
        }).toThrowError(/function/);

        expect(function() {
          exampleDf2.mapRowVectors('not a function');
        }).toThrowError(/function/);
      });
    });
  });

  describe('df.mapRowDfs', function() {
    it('behaves as expected for standard usage', function() {
      var arr1 = exampleDf1.mapRowDfs(function(df) {
        return df.at(0, 'B');
      });
      expect(arr1).toEqual(['a', 'b', 'c', 'd', 'e']);

      var arr2 = exampleDf1.mapRowDfs(function(df, index) {
        return index;
      });
      expect(arr2).toEqual([0, 1, 2, 3, 4]);

      var thisArg = {adder: 100};
      var arr3 = exampleDf1.mapRowDfs(function(df, index, thisArg) {
        return this.adder + df.at(0, 0);
      }, thisArg);
      expect(arr3).toEqual([100, 101, 102, 103, 104]);
    });

    it('returns an empty array for 0-row data frames', function() {
      var arr1 = exampleDf1.s([]).mapRowDfs(function(x) { return x; });
      expect(arr1).toEqual([]);
    });

    it('throws an error if "func" is not a function', function() {
      expect(function() {
        exampleDf2.mapRowDfs();
      }).toThrowError(/function/);

      expect(function() {
        exampleDf2.mapRowDfs('not a function');
      }).toThrowError(/function/);
    });
  });

  describe('row uniqueness:', function() {
    var uniqTestDf = jd.df([
      [ 1,   2,   2,   2,   1,   2 ],
      ['a', 'b', 'a', 'b', 'b', 'a']
    ], ['A', 'B']);

    var uniqTestDf2 = jd.colCat(uniqTestDf, {C: jd.rep({}, 6)});

    var uniqTest1ColDf = jd.df([
      jd.vector([2, NaN, 0, 2, 2, NaN, 1, 1, NaN, NaN])
    ]);

    describe('df.unique', function() {
      it('keeps the first occurrence of unique rows', function() {
        var expectedDf = jd.df([
          [ 1,   2,   2,   1 ],
          ['a', 'b', 'a', 'b']
        ], ['A', 'B']);
        expect(uniqTestDf.unique().equals(expectedDf)).toBe(true);
      });

      it('does not alter data frames with unique rows', function() {
        expect(exampleDf1.unique().equals(exampleDf1)).toBe(true);
      });

      it('works for 1-column data frames', function() {
        expect(uniqTest1ColDf.unique().c(0).values).toEqual(
          [2, NaN, 0, 1]
        );
      });

      it('works for 0-row data frames', function() {
        expect(jd.df([]).unique().equals(jd.df([]))).toBe(true);
        expect(jd.df([jd.seq(0)]).unique().equals(
          jd.df([jd.seq(0)]))).toBe(true);
      });

      it('throws an error if the data frame has "object" columns', function() {
        expect(function() {
          uniqTestDf2.unique();
        }).toThrowError(/object/);
      });
    });

    describe('df.nUnique', function() {
      it('returns the number of unique rows', function() {
        expect(uniqTestDf.nUnique()).toBe(4);
        expect(exampleDf1.nUnique()).toBe(5);
      });

      it('works for 1-column data frames', function() {
        expect(uniqTest1ColDf.nUnique()).toBe(4);
      });

      it('works for 0-row data frames', function() {
        expect(jd.df([]).nUnique()).toBe(0);
        expect(jd.df([jd.seq(0), jd.seq(0)]).nUnique()).toBe(0);
      });

      it('throws an error if the data frame has "object" columns', function() {
        expect(function() {
          uniqTestDf2.nUnique();
        }).toThrowError(/object/);
      });
    });

    describe('df.duplicated', function() {
      it('works when "keep" is "first" (the default)', function() {
        var expectedBools = [false, false, false, true, false, true];
        expect(uniqTestDf.duplicated().values).toEqual(expectedBools);
        expect(uniqTestDf.duplicated('first').values).toEqual(expectedBools);
      });

      it('works when "keep" is "last"', function() {
        expect(uniqTestDf.duplicated('last').values).toEqual(
          [false, true, true, false, false, false]
        );
      });

      it('works when "keep" is false', function() {
        expect(uniqTestDf.duplicated(false).values).toEqual(
          [false, true, true, true, false, true]
        );
      });

      it('works for 1-column data frames', function() {
        // [2, NaN, 0, 2, 2, NaN, 1, 1,   NaN, NaN]
        expect(uniqTest1ColDf.duplicated().values).toEqual(
          [false, false, false, true, true, true, false, true, true, true]
        );
        expect(uniqTest1ColDf.duplicated('first').values).toEqual(
          [false, false, false, true, true, true, false, true, true, true]
        );
        expect(uniqTest1ColDf.duplicated('last').values).toEqual(
          [true, true, false, true, false, true, true, false, true, false]
        );
        expect(uniqTest1ColDf.duplicated(false).values).toEqual(
          [true, true, false, true, true, true, true, true, true, true]
        );
      });

      it('works for 0-row data frames', function() {
        expect(jd.df([]).duplicated().values).toEqual([]);
        expect(jd.df([jd.seq(0), jd.seq(0)]).duplicated().values).toEqual([]);
      });

      it('throws an error if "keep" isn\'t a recognized value', function() {
        expect(function() {
          uniqTestDf.duplicated(true);
        }).toThrowError(/keep/);

        expect(function() {
          uniqTestDf.duplicated('unknown option');
        }).toThrowError(/keep/);
      });

      it('throws an error if the data frame has "object" columns', function() {
        expect(function() {
          uniqTestDf2.duplicated();
        }).toThrowError(/object/);
      });
    });
  });

  describe('grouping:', function() {
    var groupTestDf = jd.dfFromMatrixWithHeader([
      ['A', 'B', 'C',   'D'],
      [ 0,   1,  'a',  true],
      [ 1,   1,  'b', false],
      [ 2,   2,  'b',  true],
      [ 3,   2,  'a', false],
      [ 4,   0,  'a',  true],
      [ 5,   0, null, false],
    ]);

    var rowCount = function(df) {
      return df.nRow();
    };

    describe('df.groupApply', function() {

      it('works for scalar return values (plus "colNames")', function() {
        var df1 = groupTestDf.groupApply('C', rowCount, 'count');
        var expectedDf1 = jd.dfFromMatrixWithHeader([
          [ 'C', 'count'],
          [ 'a',      3 ],
          [ 'b',      2 ],
          [null,      1 ],
        ]);
        expect(df1.equals(expectedDf1)).toBe(true);
        var df1NullName = groupTestDf.groupApply('C', rowCount);
        expect(df1NullName.resetNames().equals(df1.resetNames())).toBe(true);
        expect(df1NullName.names().values).toEqual(['C', null]);

        var df2 = groupTestDf.groupApply(['C', 'D'], rowCount, 'count');
        var expectedDf2 = jd.dfFromMatrixWithHeader([
          [ 'C',   'D', 'count'],
          [ 'a',  true,      2 ],
          [ 'b', false,      1 ],
          [ 'b',  true,      1 ],
          [ 'a', false,      1 ],
          [null, false,      1 ],
        ]);
        expect(df2.equals(expectedDf2)).toBe(true);
      });

      it('works for vector/array return values; groupKey and groupSubset ' +
        'are up to spec', function() {

          // Check groupKey dimensions and content

          var func1 = function(subset, key) {
            return [
              key.nRow(),
              key.nCol(),
              key.at(0, 'D'),
              key.at(0, 'C'),
            ];
          };
          var df1 = groupTestDf.groupApply(['D', 'C'], func1,
            ['keyNRow', 'keyNCol', 'D_repeat', 'C_repeat']);
          expect(df1.names().values).toEqual(
            ['D', 'C', 'keyNRow', 'keyNCol', 'D_repeat', 'C_repeat']
          );
          expect(df1.c('D').values).toEqual([true, false, true, false, false]);
          expect(df1.c('C').values).toEqual(['a', 'b', 'b', 'a', null]);
          expect(df1.c('keyNRow').equals(jd.rep(1, 5))).toBe(true);
          expect(df1.c('keyNCol').equals(jd.rep(2, 5))).toBe(true);
          expect(df1.c('D').equals(df1.c('D_repeat'))).toBe(true);
          expect(df1.c('C').equals(df1.c('C_repeat'))).toBe(true);

          var df1NullName = groupTestDf.groupApply(['D', 'C'], func1);
          expect(df1NullName.resetNames().equals(df1.resetNames())).toBe(true);
          expect(df1NullName.names().values).toEqual(
            ['D', 'C', null, null, null, null]
          );

          // Check groupSubset row ordering

          var df2 = groupTestDf.groupApply('C', function(subset) {
            // Return first row as vector
            return subset.transpose().c(0);
          }, ['A', 'B', 'D']);
          var expectedDf2 = jd.dfFromMatrixWithHeader([
            [ 'C', 'A', 'B',   'D'],
            [ 'a',  0 ,  1 ,  true],
            [ 'b',  1 ,  1 , false],
            [null,  5 ,  0 , false],
          ]);
          expect(df2.equals(expectedDf2)).toBe(true);

          var df3 = groupTestDf.groupApply('C', function(subset) {
            // Return last row as vector
            return subset.transpose().c(-1);
          }, ['A', 'B', 'D']);
          var expectedDf3 = jd.dfFromMatrixWithHeader([
            [ 'C', 'A', 'B',   'D'],
            [ 'a',  4 ,  0 ,  true],
            [ 'b',  2 ,  2 ,  true],
            [null,  5 ,  0 , false],
          ]);
          expect(df3.equals(expectedDf3)).toBe(true);
        }
      );

      it('works for aggregation to 1-row data frames', function() {
        var colMeanFunc = function(subset) {
          // Return column averages for number columns
          return subset.mapCols(jd.byDtype('number'), function(v) {
            return v.mean();
          });
        };
        var df1 = groupTestDf.groupApply('D', colMeanFunc);
        var expectedDf1 = jd.dfFromMatrixWithHeader([
          [  'D', 'A', 'B'],
          [ true,  2 ,  1 ],
          [false,  3 ,  1 ],
        ]);
        expect(df1.equals(expectedDf1)).toBe(true);
        var df1WithNames = groupTestDf.groupApply('D', colMeanFunc,
          ['A_mean', 'B_mean']);
        expect(df1WithNames.names().values).toEqual(['D', 'A_mean', 'B_mean']);
        expect(df1WithNames.resetNames().equals(df1.resetNames())).toBe(true);
      });

      it('works for return values with mixed row count, including undefined',
        function() {
          var removeNullKeysFunc = function(subset, key) {
            return (key.dropNa().nRow() === 0) ? undefined : subset;
          };
          var df1 = groupTestDf.groupApply(['C', 'D'], removeNullKeysFunc);
          var expectedDf1 = jd.dfFromMatrixWithHeader([
            [ 'C',   'D', 'A', 'B'],
            [ 'a',  true,  0,   1 ],
            [ 'a',  true,  4,   0 ],
            [ 'b', false,  1,   1 ],
            [ 'b',  true,  2,   2 ],
            [ 'a', false,  3,   2 ],
          ]);
          expect(df1.equals(expectedDf1)).toBe(true);

          var df2 = groupTestDf.groupApply('C', removeNullKeysFunc);
          var expectedDf2 = jd.dfFromMatrixWithHeader([
            [ 'C', 'A', 'B',   'D'],
            [ 'a',  0,   1 ,  true],
            [ 'a',  3,   2 , false],
            [ 'a',  4,   0 ,  true],
            [ 'b',  1,   1 , false],
            [ 'b',  2,   2 ,  true],
          ]);
          expect(df2.equals(expectedDf2)).toBe(true);
        }
      );

      it('returns a 0-row data frame if "func" returns undefined for all calls',
        function() {
          var df1 = groupTestDf.groupApply(['C', 'D'], function() {
            return undefined;
          });
          var expectedDf1 = jd.df([
            jd.vector([], 'string'),
            jd.vector([], 'boolean')
          ], ['C', 'D']);
          expect(df1.equals(expectedDf1)).toBe(true);
        }
      );

      it('throws an error if "colSelect" selects any "object" columns',
        function() {
          var groupTestDf2 = groupTestDf.insertCol('E', jd.rep({}, 6));
          expect(function() {
            groupTestDf2.groupApply(['C', 'E'], rowCount);
          }).toThrowError(/object/);
        }
      );

      it('throws an error if "colSelect" selects columns more than once',
        function() {
          expect(function() {
            groupTestDf.groupApply(['C', 'D', 'C'], rowCount);
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error if no columns are selected by "colSelect"',
        function() {
          expect(function() {
            groupTestDf.groupApply([], rowCount);
          }).toThrowError(/colSelect/);
        }
      );

      it('throws an error if "colSelect" selects every column in the ' +
        'data frame',
        function() {
          expect(function() {
            groupTestDf.groupApply(groupTestDf.names(), rowCount);
          }).toThrowError(/colSelect/);
        }
      );

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          groupTestDf.groupApply('C');
        }).toThrowError(/function/);

        expect(function() {
          groupTestDf.groupApply('C', 'not a function');
        }).toThrowError(/function/);
      });

      it('throws an error if "func" return values imply inconsistent ' +
        'column counts',
        function() {
          var rowCountExpand = function(df) {
            return jd.seq(df.nRow());
          };
          expect(function() {
            groupTestDf.groupApply('C', rowCountExpand);
          }).toThrowError(/column counts/);
        }
      );

      it('throws an error if "colNames" has the wrong length',
        function() {
          expect(function() {
            groupTestDf.groupApply('C', rowCount, ['too', 'many', 'names']);
          }).toThrowError(/colNames/);
        }
      );
    });
  });

  describe('reshaping and sorting:', function() {

    describe('df.transpose', function() {

      it('works without specifying any arguments', function() {
        var expectedDf = jd.dfFromMatrix([
          [0, 1, 2, 3, 4],
          ['a', 'b', 'c', 'd', 'e'],
          [10, 10, 10, 10, 10]
        ]);
        var df = exampleDf1.transpose();
        expect(df.equals(expectedDf)).toBe(true);
        expect(df.dtypes().c('dtype').equals(jd.rep('object', 5))).toBe(true);

        expect(df.transpose().equals(exampleDf1.resetNames())).toBe(true);
      });

      it('works with "preservedColName" argument specified', function() {
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['preservedColName', 'c0', 'c1', 'c2', 'c3', 'c4'],
          ['A', 0, 1, 2, 3, 4],
          ['B', 'a', 'b', 'c', 'd', 'e'],
          ['C', 10, 10, 10, 10, 10]
        ]);
        var df = exampleDf1.transpose('preservedColName');
        expect(df.equals(expectedDf)).toBe(true);
        expect(df.c(0).equals(exampleDf1.names())).toBe(true);

        expect(df.transpose(null, 'preservedColName').equals(exampleDf1))
          .toBe(true);
      });

      it('works with "headerSelector" argument specified', function() {
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['a', 'b', 'c', 'd', 'e'],
          [0, 1, 2, 3, 4],
          [10, 10, 10, 10, 10]
        ]);
        var df = exampleDf1.transpose(null, 'B');
        expect(df.equals(expectedDf)).toBe(true);
        expect(df.names().equals(exampleDf1.c('B'))).toBe(true);
        expect(df.allDtype).toBe('number');
      });

      it('works with both arguments specified', function() {
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['oldHeader', 'a', 'b', 'c', 'd', 'e'],
          ['A', 0, 1, 2, 3, 4],
          ['C', 10, 10, 10, 10, 10]
        ]);
        var df1 = exampleDf1.transpose('oldHeader', 'B');
        expect(df1.equals(expectedDf)).toBe(true);

        var df2 = df1.transpose('B', 0);
        expect(df2.nCol()).toBe(3);
        expect(df2.s(null, ['A', 'B', 'C']).equals(exampleDf1)).toBe(true);
      });

      it('works for 0-row data frames', function() {
        expect(jd.df([]).transpose().equals(jd.df([]))).toBe(true);
        expect(jd.df([[], []]).transpose().equals(jd.df([]))).toBe(true);
      });

      it('throws an error if "preservedColName" is invalid type', function() {
        expect(function() {
          exampleDf1.transpose(10);
        }).toThrowError(/preservedColName/);
      });
    });

    describe('df.sort', function() {
      var sortTestDf = jd.dfFromMatrixWithHeader([
        ['A', 'B', 'C'],
        [ 0,   1,  'a'],
        [ 1,   1,  'b'],
        [ 2,   2,  'b'],
        [ 3,   2,  'a'],
        [ 4,   0,  'a'],
        [ 5,   0, null],
      ]);

      it('works when sorting with just 1 column', function(){
        expect(sortTestDf.sort('A').equals(sortTestDf)).toBe(true);
        var expectedDf1 = sortTestDf.mapCols(function(v) {
          return v.reverse();
        });
        expect(sortTestDf.sort(0, false).equals(expectedDf1)).toBe(true);

        var expectedDf2 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 4,   0,  'a'],
          [ 5,   0, null],
          [ 0,   1,  'a'],
          [ 1,   1,  'b'],
          [ 2,   2,  'b'],
          [ 3,   2,  'a'],
        ]);
        expect(sortTestDf.sort('B').equals(expectedDf2)).toBe(true);

        var expectedDf3 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 2,   2,  'b'],
          [ 3,   2,  'a'],
          [ 0,   1,  'a'],
          [ 1,   1,  'b'],
          [ 4,   0,  'a'],
          [ 5,   0, null],
        ]);
        expect(sortTestDf.sort('B', false).equals(expectedDf3)).toBe(true);

        var expectedDf4 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 5,   0, null],
          [ 0,   1,  'a'],
          [ 3,   2,  'a'],
          [ 4,   0,  'a'],
          [ 1,   1,  'b'],
          [ 2,   2,  'b'],
        ]);
        expect(sortTestDf.sort('C').equals(expectedDf4)).toBe(true);

        var expectedDf5 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 1,   1,  'b'],
          [ 2,   2,  'b'],
          [ 0,   1,  'a'],
          [ 3,   2,  'a'],
          [ 4,   0,  'a'],
          [ 5,   0, null],
        ]);
        expect(sortTestDf.sort('C', false).equals(expectedDf5)).toBe(true);
      });

      it('works when sorting with multiple column', function(){
        expect(sortTestDf.sort([0, 1, 2]).equals(sortTestDf)).toBe(true);

        var expectedDf1 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 5,   0, null],
          [ 4,   0,  'a'],
          [ 0,   1,  'a'],
          [ 1,   1,  'b'],
          [ 3,   2,  'a'],
          [ 2,   2,  'b'],
        ]);
        expect(sortTestDf.sort(['B', 'C']).equals(expectedDf1)).toBe(true);
        expect(sortTestDf.sort(['B', 'C'], [true, true])
          .equals(expectedDf1)).toBe(true);

        var expectedDf2 = expectedDf1.mapCols(function(v) {
          return v.reverse();
        });
        expect(sortTestDf.sort(jd.rng('B', 'C'), false)
          .equals(expectedDf2)).toBe(true);
        expect(sortTestDf.sort(jd.rng('B', 'C'), [false, false])
          .equals(expectedDf2)).toBe(true);

        var expectedDf3 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 5,   0, null],
          [ 4,   0,  'a'],
          [ 0,   1,  'a'],
          [ 3,   2,  'a'],
          [ 1,   1,  'b'],
          [ 2,   2,  'b'],
        ]);
        expect(sortTestDf.sort(['C', 'B']).equals(expectedDf3)).toBe(true);

        var expectedDf4 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 5,   0, null],
          [ 3,   2,  'a'],
          [ 0,   1,  'a'],
          [ 4,   0,  'a'],
          [ 2,   2,  'b'],
          [ 1,   1,  'b'],
        ]);
        expect(sortTestDf.sort(['C', 'B'], [true, false])
          .equals(expectedDf4)).toBe(true);

        var expectedDf5 = jd.dfFromMatrixWithHeader([
          ['A', 'B', 'C'],
          [ 1,   1,  'b'],
          [ 2,   2,  'b'],
          [ 4,   0,  'a'],
          [ 0,   1,  'a'],
          [ 3,   2,  'a'],
          [ 5,   0, null],
        ]);
        expect(sortTestDf.sort(['C', 'B'], [false, true])
          .equals(expectedDf5)).toBe(true);
      });

      it('gives stable results for underdetermined ordering', function() {
        var sortTestDf2 = jd.colCat(
          sortTestDf, {D: 10}, {E: true}
        );

        expect(sortTestDf2.sort(['D']).equals(sortTestDf2)).toBe(true);
        expect(sortTestDf2.sort(['D', 'E']).equals(sortTestDf2)).toBe(true);
        expect(sortTestDf2.sort(['E', 'D']).equals(sortTestDf2)).toBe(true);
        expect(sortTestDf2.sort(['E', 'D'], false)
          .equals(sortTestDf2)).toBe(true);
        expect(sortTestDf2.sort(['E', 'D'], [false, true])
          .equals(sortTestDf2)).toBe(true);
      });

      it('does not alter the data frame if no sort columns are selected',
        function() {
          var sortTestDf2 = sortTestDf.s(null, jd.rng('B', 'C'));
          expect(sortTestDf2.sort([]).equals(sortTestDf2)).toBe(true);
        }
      );

      it('throws an error if "colSelect" is undefined',
        function() {
          expect(function() {
            sortTestDf.sort();
          }).toThrowError(/colSelect/);
        }
      );

      it('throws an error if the sort columns include "object" columns',
        function() {
          expect(function() {
            jd.colCat(sortTestDf, {D: jd.rep({}, 6)}).sort(['A', 'D']);
          }).toThrowError(/object/);
        }
      );

      it('throws an error if "colSelect" selects columns more than once',
        function() {
          expect(function() {
            sortTestDf.sort([0, 1, 0]);
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error if "ascending" has the wrong length or type',
        function() {
          expect(function() {
            sortTestDf.sort('A', [true, false]);
          }).toThrowError(/ascending/);

          expect(function() {
            sortTestDf.sort(['B', 'A', 'C'], [true, false]);
          }).toThrowError(/ascending/);

          expect(function() {
            sortTestDf.sort(['A', 'B'], [true, null]);
          }).toThrowError(/ascending/);

          expect(function() {
            sortTestDf.sort(['A', 'B'], [1, 2]);
          }).toThrowError(/boolean/);

          expect(function() {
            sortTestDf.sort(['A', 'B'], 10);
          }).toThrowError(/boolean/);
        }
      );
    });

    describe('df.melt', function() {
      var meltTestDf = jd.dfFromMatrixWithHeader([
        ['id1', 'A', 'id2', 'B', 'C'],
        [  'a',  0,    'x',  10,  20],
        [  'b',  1,    'y',  11,  21],
        [  'c',  2,    'z',  12,  22],
      ]);

      var expectedDf1 = jd.dfFromMatrixWithHeader([
        ['id1', 'id2', 'variable', 'value'],
        [  'a',   'x',        'A',      0 ],
        [  'b',   'y',        'A',      1 ],
        [  'c',   'z',        'A',      2 ],
        [  'a',   'x',        'B',     10 ],
        [  'b',   'y',        'B',     11 ],
        [  'c',   'z',        'B',     12 ],
        [  'a',   'x',        'C',     20 ],
        [  'b',   'y',        'C',     21 ],
        [  'c',   'z',        'C',     22 ],
      ]);

      it('works with just 1 id column', function() {
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['id2', 'variable', 'value'],
          [  'x',      'id1',     'a'],
          [  'y',      'id1',     'b'],
          [  'z',      'id1',     'c'],
          [  'x',        'A',      0 ],
          [  'y',        'A',      1 ],
          [  'z',        'A',      2 ],
          [  'x',        'B',     10 ],
          [  'y',        'B',     11 ],
          [  'z',        'B',     12 ],
          [  'x',        'C',     20 ],
          [  'y',        'C',     21 ],
          [  'z',        'C',     22 ],
        ]);

        expect(meltTestDf.melt('id2').equals(expectedDf)).toBe(true);
      });

      it('works with multiple id columns', function() {
        var meltDf1 = meltTestDf.melt(['id1', 'id2']);
        expect(meltDf1.equals(expectedDf1)).toBe(true);

        var meltDf2 = meltTestDf.melt(['id2', 'id1']);
        expect(meltDf2.names().values).toEqual([
          'id2', 'id1', 'variable', 'value'
        ]);
        expect(meltDf2.s(null, ['id1', 'id2', 'variable', 'value']).equals(
          meltDf1)).toBe(true);

        var expectedDf3 = jd.dfFromMatrixWithHeader([
          ['A', 'id1', 'B', 'id2', 'variable', 'value'],
          [ 0 ,   'a',  10,   'x',        'C',     20 ],
          [ 1 ,   'b',  11,   'y',        'C',     21 ],
          [ 2 ,   'c',  12,   'z',        'C',     22 ],
        ]);
        var meltDf3 = meltTestDf.melt(['A', 'id1', 'B', 'id2']);
        expect(meltDf3.equals(expectedDf3)).toBe(true);
      });

      it('works with 0 id columns', function() {
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['variable', 'value'],
          [     'id1',     'a'],
          [     'id1',     'b'],
          [     'id1',     'c'],
          [       'A',      0 ],
          [       'A',      1 ],
          [       'A',      2 ],
          [     'id2',     'x'],
          [     'id2',     'y'],
          [     'id2',     'z'],
          [       'B',     10 ],
          [       'B',     11 ],
          [       'B',     12 ],
          [       'C',     20 ],
          [       'C',     21 ],
          [       'C',     22 ],
        ]);
        expect(meltTestDf.melt([]).equals(expectedDf)).toBe(true);
      });

      it('uses "varName" and "valueName" when specified', function() {
        var meltDf1 = meltTestDf.melt(['id1', 'id2'], 'varName');
        expect(meltDf1.names().values).toEqual([
          'id1', 'id2', 'varName', 'value'
        ]);
        expect(meltDf1.resetNames().equals(expectedDf1.resetNames()))
          .toBe(true);

        var meltDf2 = meltTestDf.melt(['id1', 'id2'], 'varName', 'valueName');
        expect(meltDf2.names().values).toEqual([
          'id1', 'id2', 'varName', 'valueName'
        ]);
        expect(meltDf2.resetNames().equals(expectedDf1.resetNames()))
          .toBe(true);
      });

      it('throws an error if "idVars" makes duplicate selections',
        function() {
          expect(function() {
            meltTestDf.melt(['id1', 'id2', 'id1']);
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error if all columns are id columns', function() {
        expect(function() {
          meltTestDf.melt(meltTestDf.names());
        }).toThrowError(/idVars/);
      });
    });

    describe('df.pivot', function() {
      var pivotTestDf = jd.dfFromMatrixWithHeader([
        ['W', 'X', 'Y', 'Z'],
        ['a', 'u', 'B',  5 ],
        ['a', 'v', 'A', NaN],
        ['b', 'u', 'A',  7 ],
        ['b', 'v', 'B',  8 ],
        ['c', 'u', 'B',  9 ],
      ]);

      var expectedDf1 = jd.dfFromMatrixWithHeader([
        ['W', 'X', 'A', 'B'],
        ['a', 'u', NaN,  5 ],
        ['a', 'v', NaN, NaN],
        ['b', 'u',  7 , NaN],
        ['b', 'v', NaN,  8 ],
        ['c', 'u', NaN,  9 ],
      ]);

      var expectedDf2 = jd.dfFromMatrixWithHeader([
        ['W', 'A', 'B'],
        ['a', NaN,  5 ],
        ['b',  7 ,  8 ],
        ['c', NaN,  9 ],
      ]);

      it('works with no "idVar" or "aggFunc" specified', function() {
        var pivotDf = pivotTestDf.pivot('Y', 'Z');
        expect(pivotDf.equals(expectedDf1)).toBe(true);
      });

      it('works with "idVar" selecting a subset of id columns', function() {
        var pivotDf = pivotTestDf.pivot('Y', 'Z', {idVars: 'W'});
        expect(pivotDf.equals(expectedDf2)).toBe(true);
      });

      it('works with "aggFunc" specified', function() {
        var aggFunc = function(vec) {
          var mean = vec.mean();
          return Number.isNaN(mean) ? -1 : mean;
        };

        var pivotDf1 = pivotTestDf.pivot('Y', 'Z',
          {idVars: 'W', aggFunc: aggFunc});
        var expected1 = expectedDf2.sMod(0, 'A', -1);
        expect(pivotDf1.equals(expected1)).toBe(true);

        var expected2 = jd.dfFromMatrixWithHeader([
          ['X', 'A', 'B'],
          ['u',  7 ,  7 ],
          ['v', -1 ,  8 ],
        ]);
        var pivotDf2 = pivotTestDf.pivot('Y', 'Z',
          {idVars: 'X', aggFunc: aggFunc});
        expect(pivotDf2.equals(expected2)).toBe(true);
      });

      it('works with "fillValue" specified', function() {
        var pivotDf1 = pivotTestDf.pivot('Y', 'Z', {fillValue: -1});
        var expected1 = expectedDf1.updateCols(['A', 'B'], function(vec) {
          return vec.replaceNa(-1);
        });
        expect(pivotDf1.equals(expected1)).toBe(true);

        var pivotDf2 = pivotTestDf.pivot('Y', 'Z',
          {idVars: 'W', fillValue: -1});
        var expected2 = expectedDf2.updateCols(['A', 'B'], function(vec) {
          return vec.replaceNa(-1);
        });
        expect(pivotDf2.equals(expected2)).toBe(true);
      });

      it('throws an error if aggregation is required but "aggFunc" is missing',
        function() {
          expect(function() {
            pivotTestDf.pivot('Y', 'Z', {idVars: 'X'});
          }).toThrowError(/aggFunc/);
        }
      );

      it('throws an error if there are no id columns', function() {
        expect(function() {
          pivotTestDf.pivot('Y', 'Z', {idVars: []});
        }).toThrowError(/id columns/);

        expect(function() {
          pivotTestDf.s(null, ['Y', 'Z']).pivot('Y', 'Z');
        }).toThrowError(/id columns/);
      });

      it('throws an error if "pivotCol" and "valueCol" are the same',
        function() {
          expect(function() {
            pivotTestDf.pivot('Y', 'Y');
          }).toThrowError(/pivotCol/);
        }
      );

      it('throws an error if "idVars" overlaps with pivot or value column',
        function() {
          expect(function() {
            pivotTestDf.pivot('Y', 'Z', {idVars: ['W', 'Y']});
          }).toThrowError(/idVars/);

          expect(function() {
            pivotTestDf.pivot('Y', 'Z', {idVars: ['W', 'Z']});
          }).toThrowError(/idVars/);
        }
      );

      it('throws an error if "opts" contains unrecognized properties',
        function() {
          expect(function() {
            pivotTestDf.pivot('Y', 'Z', {invalidProp: 10});
          }).toThrowError(/invalidProp/);
        }
      );
    });
  });

  describe('joins:', function() {

    describe('df.join', function() {
      var joinTestDf1 = jd.dfFromMatrixWithHeader([
        ['leftKey', 'key2', 'val'],
        [      'a',    'x',    0 ],
        [      'b',    'x',    1 ],
        [      'c',    'y',    2 ],
        [      'a',    'y',    3 ],
      ]);

      var joinTestDf2 = jd.dfFromMatrixWithHeader([
        ['rightKey', 'key2', 'val'],
        [       'a',    'x',   10 ],
        [       'd',    'z',   11 ],
        [       'a',    'y',   12 ],
        [       'b',    'z',   13 ],
      ]);

      var fullJoinKey1Df = jd.dfFromMatrixWithHeader([
        ['leftKey', 'key2_x', 'val_x', 'key2_y', 'val_y',     '_join'],
        [      'a',      'x',      0 ,      'x',     10 ,      'both'],
        [      'a',      'x',      0 ,      'y',     12 ,      'both'],
        [      'b',      'x',      1 ,      'z',     13 ,      'both'],
        [      'c',      'y',      2 ,     null,    NaN ,  'leftOnly'],
        [      'a',      'y',      3 ,      'x',     10 ,      'both'],
        [      'a',      'y',      3 ,      'y',     12 ,      'both'],
        [      'd',     null,    NaN ,      'z',     11 , 'rightOnly'],
      ]);

      var fullJoinKey2Df = jd.dfFromMatrixWithHeader([
        ['key2', 'leftKey', 'val_x', 'rightKey', 'val_y',     '_join'],
        [   'x',       'a',      0 ,        'a',     10 ,      'both'],
        [   'x',       'b',      1 ,        'a',     10 ,      'both'],
        [   'y',       'c',      2 ,        'a',     12 ,      'both'],
        [   'y',       'a',      3 ,        'a',     12 ,      'both'],
        [   'z',      null,    NaN ,        'd',     11 , 'rightOnly'],
        [   'z',      null,    NaN ,        'b',     13 , 'rightOnly'],
      ]);

      var fullJoinBothKeysDf = jd.dfFromMatrixWithHeader([
        ['leftKey', 'key2', 'val_x', 'val_y',     '_join'],
        [      'a',    'x',      0 ,     10 ,      'both'],
        [      'b',    'x',      1 ,    NaN ,  'leftOnly'],
        [      'c',    'y',      2 ,    NaN ,  'leftOnly'],
        [      'a',    'y',      3 ,     12 ,      'both'],
        [      'd',    'z',    NaN ,     11 , 'rightOnly'],
        [      'b',    'z',    NaN ,     13 , 'rightOnly'],
      ]);


      // Helper for subsetting joinDf by only selecting rows with
      // "_join" column containing values in "indicatorValues"
      var subsetOnIndicator = function(joinDf, indicatorValues) {
        var boolInd = joinDf.c('_join').isIn(indicatorValues);
        return joinDf.s(boolInd);
      };

      it('works for inner joins', function() {
        var expectedKey1Df = subsetOnIndicator(fullJoinKey1Df,
          'both').s(null, jd.ex('_join'));
        var df1 = joinTestDf1.join(joinTestDf2, 'inner',
          {by: {leftKey: 'rightKey'}});
        expect(df1.equals(expectedKey1Df)).toBe(true);

        var expectedKey2Df = subsetOnIndicator(fullJoinKey2Df,
          'both').s(null, jd.ex('_join'));
        var df2 = joinTestDf1.join(joinTestDf2, 'inner', {by: 'key2'});
        expect(df2.equals(expectedKey2Df)).toBe(true);

        var expectedKey3Df = subsetOnIndicator(fullJoinBothKeysDf,
          'both').s(null, jd.ex('_join'));
        var df3 = joinTestDf1.join(joinTestDf2, 'inner',
          {leftBy: ['leftKey', 'key2'], rightBy: ['rightKey', 'key2']});
        expect(df3.equals(expectedKey3Df)).toBe(true);
      });

      it('works for left outer joins', function() {
        var expectedKey1Df = subsetOnIndicator(fullJoinKey1Df,
          ['both', 'leftOnly']).s(null, jd.ex('_join'));
        var df1 = joinTestDf1.join(joinTestDf2, 'left',
          {by: {leftKey: 'rightKey'}});
        expect(df1.equals(expectedKey1Df)).toBe(true);

        var expectedKey2Df = subsetOnIndicator(fullJoinKey2Df,
          ['both', 'leftOnly']).s(null, jd.ex('_join'));
        var df2 = joinTestDf1.join(joinTestDf2, 'left', {by: 'key2'});
        expect(df2.equals(expectedKey2Df)).toBe(true);

        var expectedKey3Df = subsetOnIndicator(fullJoinBothKeysDf,
          ['both', 'leftOnly']).s(null, jd.ex('_join'));
        var df3 = joinTestDf1.join(joinTestDf2, 'left',
          {leftBy: ['leftKey', 'key2'], rightBy: ['rightKey', 'key2']});
        expect(df3.equals(expectedKey3Df)).toBe(true);
      });

      it('works for right outer joins', function() {
        var expectedKey1Df = subsetOnIndicator(fullJoinKey1Df,
          ['both', 'rightOnly']).s(null, jd.ex('_join'));
        var df1 = joinTestDf1.join(joinTestDf2, 'right',
          {by: {leftKey: 'rightKey'}});
        expect(df1.equals(expectedKey1Df)).toBe(true);

        var expectedKey2Df = subsetOnIndicator(fullJoinKey2Df,
          ['both', 'rightOnly']).s(null, jd.ex('_join'));
        var df2 = joinTestDf1.join(joinTestDf2, 'right', {by: 'key2'});
        expect(df2.equals(expectedKey2Df)).toBe(true);

        var expectedKey3Df = subsetOnIndicator(fullJoinBothKeysDf,
          ['both', 'rightOnly']).s(null, jd.ex('_join'));
        var df3 = joinTestDf1.join(joinTestDf2, 'right',
          {leftBy: ['leftKey', 'key2'], rightBy: ['rightKey', 'key2']});
        expect(df3.equals(expectedKey3Df)).toBe(true);
      });

      it('works for full outer joins', function() {
        var expectedKey1Df = fullJoinKey1Df.s(null, jd.ex('_join'));
        var df1 = joinTestDf1.join(joinTestDf2, 'outer',
          {by: {leftKey: 'rightKey'}});
        expect(df1.equals(expectedKey1Df)).toBe(true);

        var expectedKey2Df = fullJoinKey2Df.s(null, jd.ex('_join'));
        var df2 = joinTestDf1.join(joinTestDf2, 'outer', {by: 'key2'});
        expect(df2.equals(expectedKey2Df)).toBe(true);

        var expectedKey3Df = fullJoinBothKeysDf.s(null, jd.ex('_join'));
        var df3 = joinTestDf1.join(joinTestDf2, 'outer',
          {leftBy: ['leftKey', 'key2'], rightBy: ['rightKey', 'key2']});
        expect(df3.equals(expectedKey3Df)).toBe(true);
      });

      it('can be set to use custom left/right suffixes', function() {
        var expectedDf = fullJoinKey2Df.s(null, jd.ex('_join'));
        var df = joinTestDf1.join(joinTestDf2, 'outer',
          {by: 'key2', leftSuffix: '_left', rightSuffix: '_right'});
        expect(df.names().values).toEqual([
          'key2', 'leftKey', 'val_left', 'rightKey', 'val_right'
        ]);
        expect(df.resetNames().equals(expectedDf.resetNames())).toBe(true);
      });

      it('can be set to include the "_join" indicator column', function() {
        var df1 = joinTestDf1.join(joinTestDf2, 'outer',
          {by: {leftKey: 'rightKey'}, indicator: true});
        expect(df1.equals(fullJoinKey1Df)).toBe(true);

        var df2 = joinTestDf1.join(joinTestDf2, 'outer',
          {by: 'key2', indicator: true});
        expect(df2.equals(fullJoinKey2Df)).toBe(true);

        var df3 = joinTestDf1.join(joinTestDf2, 'outer',
          {leftBy: ['leftKey', 'key2'], rightBy: ['rightKey', 'key2'],
          indicator: true});
        expect(df3.equals(fullJoinBothKeysDf)).toBe(true);
      });

      var emptyJoinDf = jd.df([[], [], [], []],
        ['key2', 'val', 'leftKey', 'rightKey']);

      it('works when there are no matches', function() {
        var df1 = joinTestDf1.join(joinTestDf2, 'inner');
        expect(df1.equals(emptyJoinDf)).toBe(true);
      });

      it('works for 0-row data frames', function() {
        var df1 = joinTestDf1.join(joinTestDf2.s([]), 'inner');
        expect(df1.equals(emptyJoinDf)).toBe(true);

        var df2 = joinTestDf1.s([]).join(joinTestDf2, 'inner');
        expect(df1.equals(emptyJoinDf)).toBe(true);
      });

      it('treats null keys just like any other value', function() {
        var leftDf = jd.dfFromMatrixWithHeader([
          ['key', 'val1'],
          [ true,     0 ],
          [ null,     1 ],
        ]);
        var rightDf = jd.dfFromMatrixWithHeader([
          ['key', 'val2'],
          [ null,    10 ],
          [ true,    11 ],
          [ null,    12 ],
        ]);
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['key', 'val1', 'val2'],
          [ true,     0 ,    11 ],
          [ null,     1 ,    10 ],
          [ null,     1 ,    12 ],
        ]);
        expect(leftDf.join(rightDf, 'inner').equals(expectedDf)).toBe(true);
      });

      it('throws an error if "other" is not a data frame', function() {
        expect(function() {
          joinTestDf1.join(['invalid'], 'inner');
        }).toThrowError(/other/);
      });

      it('throws an error for invalid choice of "how"', function() {
        expect(function() {
          joinTestDf1.join(joinTestDf2, 'invalid');
        }).toThrowError(/how/);

        expect(function() {
          joinTestDf1.join(joinTestDf2);
        }).toThrowError(/how/);
      });

      it('throws an error for invalid properties in "opts"', function() {
        expect(function() {
          joinTestDf1.join(joinTestDf2, 'inner', {invalidPropName: 0});
        }).toThrowError(/opts/);
      });

      it('throws an error for inconsistent key column dtypes', function() {
        expect(function() {
          joinTestDf1.join(joinTestDf2, 'inner',
            {leftBy: 'key2', rightBy: 'val'});
        }).toThrowError(/dtypes/);
      });

      it('throws an error if any key column dtype is "object"', function() {
        var leftDf = joinTestDf1.insertCol('objCol', jd.rep({}, 4));
        var rightDf = joinTestDf2.insertCol('objCol', jd.rep({}, 4));

        expect(function() {
          leftDf.join(rightDf, 'inner', {by: 'objCol'});
        }).toThrowError(/object/);
      });

      it('throws an error for competing "by" / "leftBy" / "rightBy" ' +
        'specifications',
        function() {
          expect(function() {
            joinTestDf1.join(joinTestDf2, 'inner',
              {by: 'key2', leftBy: 'key2', rightBy: 'key2'});
          }).toThrowError(/leftBy/);
        }
      );

      it('throws an error for inconsistent "leftBy" / "rightBy"', function() {
        expect(function() {
          joinTestDf1.join(joinTestDf2, 'inner',
            {leftBy: ['leftKey', 'key2'], rightBy: ['key2']});
        }).toThrowError(/number of key column/);
      });

      it('throws an error for selection of non-present key columns',
        function() {
          expect(function() {
            joinTestDf1.join(joinTestDf2, 'inner',
              {by: 'invalidCol'});
          }).toThrowError(/invalidCol/);

          expect(function() {
            joinTestDf1.join(joinTestDf2, 'inner',
              {leftBy: 'key2', rightBy: 'invalidCol'});
          }).toThrowError(/invalidCol/);
        }
      );

      it('throws an error for selection of non-unique key columns',
        function() {
          var leftDf = joinTestDf1.insertCol('key2', jd.seq(4));
          var rightDf = joinTestDf2.insertCol('key2', jd.seq(4));

          expect(function() {
            leftDf.join(rightDf, 'inner', {by: 'key2'});
          }).toThrowError(/duplicate/);
        }
      );

      it('throws an error for empty key column selections', function() {
        expect(function() {
          joinTestDf1.join(joinTestDf2, 'inner',
            {leftBy: [], rightBy: []});
        }).toThrowError(/key column/);
      });
    });

  });

});
