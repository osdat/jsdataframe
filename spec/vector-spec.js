
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

    describe('vector.toString', function() {
      it('provides a customized description of the vector', function() {
        expect(jd.seq(5).toString()).toBe(
          'Vector[dtype:number, size:5]'
        );
        expect(jd.seqOut('A', 26).toString()).toBe(
          'Vector[dtype:string, size:26]'
        );
        expect(jd.vector([]).toString()).toBe(
          'Vector[dtype:object, size:0]'
        );
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
        var vector = jd.vector([0, 1, 0, 2, NaN]).toDtype('string');
        expect(vector.dtype).toBe('string');
        expect(vector.values).toEqual(['0', '1', '0', '2', null]);
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

    describe('vector.pack', function() {
      it('works for number vectors', function() {
        var vector = jd.vector([0, 1, 2.5, -1, NaN], 'number');
        var json = JSON.stringify(vector.pack());
        var vector2 = jd.unpack(JSON.parse(json));
        expect(vector2.dtype).toBe('number');
        expect(vector.equals(vector2)).toBe(true);
      });

      it('works for boolean vectors', function() {
        var vector = jd.vector([true, false, true, null], 'boolean');
        var json = JSON.stringify(vector.pack());
        var vector2 = jd.unpack(JSON.parse(json));
        expect(vector2.dtype).toBe('boolean');
        expect(vector.equals(vector2)).toBe(true);
      });

      it('works for string vectors', function() {
        var vector = jd.vector(['test', 'text', '"', '', null], 'string');
        var json = JSON.stringify(vector.pack());
        var vector2 = jd.unpack(JSON.parse(json));
        expect(vector2.dtype).toBe('string');
        expect(vector.equals(vector2)).toBe(true);
      });

      it('works for date vectors', function() {
        var vector = jd.vector([0, 60*60*1e3, null], 'date');
        var json = JSON.stringify(vector.pack());
        var vector2 = jd.unpack(JSON.parse(json));
        expect(vector2.dtype).toBe('date');
        expect(vector.equals(vector2)).toBe(true);
      });

      it('works for object vectors without touching the elements', function() {
        var vector = jd.vector([1.5, 'two', true, null], 'object');
        var json = JSON.stringify(vector.pack());
        var vector2 = jd.unpack(JSON.parse(json));
        expect(vector2.dtype).toBe('object');
        expect(vector.equals(vector2)).toBe(true);
      });
    });
  });

  describe('missing values:', function() {
    var exampleVector = jd.vector([NaN, 1, NaN, 2, 3, NaN]);

    describe('vector.isNa', function() {
      it('behaves as expected', function() {
        var vector = exampleVector.isNa();
        expect(vector.dtype).toBe('boolean');
        expect(vector.values).toEqual([true, false, true, false, false, true]);

        var vector2 = jd.vector([]).isNa();
        expect(vector2.dtype).toBe('boolean');
        expect(vector2.values).toEqual([]);
      });
    });

    describe('vector.dropNa', function() {
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

    describe('vector.replaceNa', function() {
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

  describe('subset selection / modification:', function() {
    var vector = jd.seq(10, 15);

    describe('vector.s', function() {

      it('returns this vector if selector is null', function() {
        expect(vector.s(null)).toBe(vector);
      });

      describe('boolean indexing', function() {
        it('works for boolean vectors', function() {
          var selector = jd.vector([true, false, true, false, true]);
          expect(vector.s(selector).values).toEqual([10, 12, 14]);
        });

        it('works for boolean arrays', function() {
          expect(vector.s([false, true, null, true, null]).values).toEqual(
            [11, 13]
          );
        });

        it('requires the vector or array to be the right length', function() {
          expect(function() {
            vector.s([true]);
          }).toThrowError(/length/);

          expect(function() {
            vector.s([true, false]);
          }).toThrowError(/length/);

          expect(function() {
            vector.s(jd.rep(true, 6));
          }).toThrowError(/length/);
        });
      });

      describe('integer indexing', function() {
        it('works for integer vectors', function() {
          var selector = jd.vector([3, 0, -3]);
          expect(vector.s(selector).values).toEqual([13, 10, 12]);

          expect(vector.s(jd.vector([2])).values).toEqual([12]);

          var subset = vector.s(jd.vector([], 'number'));
          expect(subset.dtype).toBe('number');
          expect(subset.values).toEqual([]);
        });

        it('works for integer arrays', function() {
          expect(vector.s([-2, 2, 1, 2]).values).toEqual([13, 12, 11, 12]);

          expect(vector.s([2]).values).toEqual([12]);

          var subset = vector.s([]);
          expect(subset.dtype).toBe('number');
          expect(subset.values).toEqual([]);
        });

        it('works for integer scalars', function() {
          expect(vector.s(4).values).toEqual([14]);
          expect(vector.s(-5).values).toEqual([10]);
        });

        it('works for integer ranges', function() {
          expect(vector.s(jd.rng(1, 3)).values).toEqual([11, 12]);
          expect(vector.s(jd.rng(1, 3, true)).values).toEqual([11, 12, 13]);
          expect(vector.s(jd.rng(undefined, 3)).values).toEqual([10, 11, 12]);
          expect(vector.s(jd.rng(2, undefined)).values).toEqual([12, 13, 14]);
          expect(vector.s(jd.rng(1, -2)).values).toEqual([11, 12]);
          expect(vector.s(jd.rng(-99, -2)).values).toEqual([10, 11, 12]);
          expect(vector.s(jd.rng(-2, 99)).values).toEqual([13, 14]);
          expect(vector.s(jd.rng(4, 4)).values).toEqual([]);
          expect(vector.s(jd.rng(4, 4, true)).values).toEqual([14]);
          expect(vector.s(jd.rng(3, 1, true)).values).toEqual([]);
        });

        it('works for integer range concatenations', function() {
          var selector1 = [
            jd.rng(-2, undefined), jd.rng(undefined, -2)
          ];
          expect(vector.s(selector1).values).toEqual([13, 14, 10, 11, 12]);

          var selector2 = [
            [0, 2], -1, jd.rng(1, 4), [1, [2, 3]]
          ];
          expect(vector.s(selector2).values).toEqual(
            [10, 12, 14, 11, 12, 13, 11, 12, 13]
          );

          expect(vector.s([jd.rng(1).ex(), jd.rng(2).ex()]).values).toEqual(
            [10, 10, 11]
          );
        });

        it('works for exclusions', function() {
          var boolVec = jd.vector([true, false, true, null, true]);
          expect(vector.s(jd.ex(boolVec.values)).values).toEqual([11, 13]);
          expect(vector.s(boolVec.ex()).values).toEqual([11, 13]);
          expect(vector.s(jd.ex(-1)).values).toEqual([10, 11, 12, 13]);
          expect(vector.s(jd.ex([3, 4])).values).toEqual([10, 11, 12]);
          expect(vector.s(jd.seq(2).ex()).values).toEqual([12, 13, 14]);
          expect(vector.s(jd.seq(0).ex()).values).toEqual(vector.values);
          expect(vector.s(jd.rng(0, -1, true).ex()).values).toEqual([]);
          expect(vector.s(jd.rng(1, -1).ex()).values).toEqual([10, 14]);
          var selector = jd.ex([jd.rng(0, 2), jd.rng(3, undefined)]);
          expect(vector.s(selector).values).toEqual([12]);
        });

        it('requires all integer indices to be within bounds', function() {
          expect(function() {
            vector.s([0, 5]);
          }).toThrowError(/bounds/);

          expect(function() {
            vector.s(-6);
          }).toThrowError(/bounds/);
        });

        it('does not allow NaN indices', function() {
          expect(function() {
            vector.s([0, 2, NaN]);
          }).toThrowError(/non-integer/);

          expect(function() {
            vector.s(jd.rng(3, NaN));
          }).toThrowError(/non-integer/);

          expect(function() {
            vector.s([[0, 2], NaN]);
          }).toThrowError(/non-integer/);
        });

        it('requires all indices to be integers', function() {
          expect(function() {
            vector.s([0, 2, 1.5]);
          }).toThrowError(/non-integer/);

          expect(function() {
            vector.s(jd.rng(0, 1.5));
          }).toThrowError(/non-integer/);

          expect(function() {
            vector.s([[0, 2], 1.5]);
          }).toThrowError(/non-integer/);
        });

        it('fails for non-numeric indices', function() {
          expect(function() {
            vector.s('string');
          }).toThrowError(/integer indexing/);

          expect(function() {
            vector.s(jd.rng(0, 'string', true));
          }).toThrowError(/integer indexing/);

          expect(function() {
            vector.s([[0, 2], 'string']);
          }).toThrowError(/integer indexing/);
        });
      });
    });

    describe('vector.sMod', function() {
      it('behaves as expected without modifying the original vector',
        function() {
          expect(vector.sMod(0, 100).values).toEqual(
            [100, 11, 12, 13, 14]
          );
          expect(vector.sMod([0, 2, 4], 0).values).toEqual(
            [0, 11, 0, 13, 0]
          );
          expect(vector.sMod(jd.rng(-3), [3, 2, 1]).values).toEqual(
            [10, 11, 3, 2, 1]
          );
          expect(vector.sMod(jd.seq(2), jd.seq(2)).values).toEqual(
            [0, 1, 12, 13, 14]
          );

          expect(vector.values).toEqual(jd.seq(10, 15).values);
        }
      );

      it('works as expected when replacing every element', function() {
        expect(vector.sMod(jd.seq(5), jd.seq(5)).equals(jd.seq(5))).toBe(true);
      });

      it('works as expected when "values" is empty', function() {
        expect(vector.sMod([], jd.repNa(0, 'number')).equals(vector))
          .toBe(true);
      });

      it('uses the last modification if an element is selected multiple times',
        function() {
          var vector = jd.rep(0, 3);
          expect(vector.sMod([1, 2, 1], jd.seq(3)).values).toEqual(
            [0, 2, 1]
          );
        }
      );

      it('throws an error if "values" has the wrong dtype',
        function() {
          expect(function() {
            vector.sMod(0, 'string');
          }).toThrowError(/dtype/);

          expect(function() {
            vector.sMod(jd.rng(2, 4), [true, false]);
          }).toThrowError(/dtype/);
        }
      );

      it('throws an error if "values" is the wrong length for the selection',
        function() {
          expect(function() {
            vector.sMod(jd.seq(2), jd.seq(3));
          }).toThrowError(/length/);
        }
      );
    });

    describe('vector.at', function() {
      it('behaves as expected for single integer "i" values', function() {
        expect(vector.at(4)).toBe(14);
        expect(vector.at([-3])).toBe(12);
        expect(vector.at(jd.vector([-5]))).toBe(10);
      });

      it('throws an error for non-integer "i" values', function() {
        expect(function() {
          vector.at('string');
        }).toThrowError(/integer/);

        expect(function() {
          vector.at(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          vector.at(NaN);
        }).toThrowError(/integer/);
      });

      it('throws an error if "i" is out of bounds', function() {
        expect(function() {
          vector.at(5);
        }).toThrowError(/bounds/);

        expect(function() {
          vector.at(-6);
        }).toThrowError(/bounds/);
      });

      it('throws an error if "i" has length greater than 1', function() {
        expect(function() {
          vector.at([0, 1]);
        }).toThrowError(/length/);

        expect(function() {
          vector.at(jd.seq(3));
        }).toThrowError(/length/);
      });
    });

    describe('vector.head', function() {
      it('behaves as expected for nonnegative "n"', function() {
        expect(vector.head(3).values).toEqual([10, 11, 12]);
        expect(vector.head(1).values).toEqual([10]);
        expect(vector.head(5).values).toEqual(vector.values);
        expect(vector.head(50).values).toEqual(vector.values);
        expect(vector.head(0).values).toEqual([]);
      });

      it('behaves as expected for negative "n"', function() {
        expect(vector.head(-2).values).toEqual([10, 11, 12]);
        expect(vector.head(-4).values).toEqual([10]);
        expect(vector.head(-5).values).toEqual([]);
        expect(vector.head(-50).values).toEqual([]);
      });

      it('defaults to n = 6', function() {
        expect(jd.seq(10).head().values).toEqual(jd.seq(6).values);
      });

      it('throws an error if "n" is not an integer', function() {
        expect(function() {
          vector.head('string');
        }).toThrowError(/integer/);

        expect(function() {
          vector.head(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          vector.head(NaN);
        }).toThrowError(/integer/);
      });
    });

    describe('vector.tail', function() {
      it('behaves as expected for nonnegative "n"', function() {
        expect(vector.tail(3).values).toEqual([12, 13, 14]);
        expect(vector.tail(1).values).toEqual([14]);
        expect(vector.tail(5).values).toEqual(vector.values);
        expect(vector.tail(50).values).toEqual(vector.values);
        expect(vector.tail(0).values).toEqual([]);
      });

      it('behaves as expected for negative "n"', function() {
        expect(vector.tail(-2).values).toEqual([12, 13, 14]);
        expect(vector.tail(-4).values).toEqual([14]);
        expect(vector.tail(-5).values).toEqual([]);
        expect(vector.tail(-50).values).toEqual([]);
      });

      it('defaults to n = 6', function() {
        expect(jd.seq(10).tail().values).toEqual(jd.seq(4, 10).values);
      });

      it('throws an error if "n" is not an integer', function() {
        expect(function() {
          vector.tail('string');
        }).toThrowError(/integer/);

        expect(function() {
          vector.tail(1.5);
        }).toThrowError(/integer/);

        expect(function() {
          vector.tail(NaN);
        }).toThrowError(/integer/);
      });
    });

    describe('vector.ifElse', function() {
      var cond = jd.vector([true, false, true, null, false]);

      it('behaves as expected for normal usage', function() {
        expect(vector.ifElse(cond, 0).values).toEqual(
          [10, 0, 12, NaN, 0]
        );
        expect(vector.ifElse(cond, null).values).toEqual(
          [10, NaN, 12, NaN, NaN]
        );
        expect(vector.ifElse(cond.values, jd.seq(5)).values).toEqual(
          [10, 1, 12, NaN, 4]
        );
        expect(vector.ifElse(cond, jd.seq(5).values).values).toEqual(
          [10, 1, 12, NaN, 4]
        );
      });

      it('throws an error if "cond" is not boolean dtype', function() {
        expect(function() {
          vector.ifElse(jd.seq(5), 0);
        }).toThrowError(/boolean/);
      });

      it('throws an error if "cond" is the wrong length', function() {
        expect(function() {
          vector.ifElse(jd.rep(true, 3), 0);
        }).toThrowError(/length/);

        expect(function() {
          vector.ifElse(true, 0);
        }).toThrowError(/length/);
      });

      it('throws an error if "other" is the wrong dtype', function() {
        expect(function() {
          vector.ifElse(cond, 'string');
        }).toThrowError(/dtype/);
      });

      it('throws an error if "other" is the wrong length', function() {
        expect(function() {
          vector.ifElse(cond, jd.seq(3));
        }).toThrowError(/length/);
      });
    });
  });

  describe('Array.prototype adaptations:', function() {
    var add = function(x, y) { return x + y; };
    var exampleNumVec = jd.vector([3, 0, 1, 20, 1]);

    describe('vector.map', function() {

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

    describe('vector.reduce', function() {

      it('behaves as expected', function() {
        expect(jd.seq(5).reduce(add, 10)).toBe(20);
      });
    });

    describe('vector.reduceRight', function() {

      it('behaves as expected', function() {
        expect(jd.seq(5).reduceRight(add, 10)).toBe(20);
      });
    });

    describe('vector.findIndex', function() {

      it('behaves as expected', function() {
        expect(exampleNumVec.findIndex(function(x) { return x === 1; }))
          .toBe(2);

        expect(exampleNumVec.findIndex(function(x) { return x === -10; }))
          .toBe(-1);
      });
    });

    describe('vector.indexOf', function() {
      it('behaves as expected', function() {
        expect(exampleNumVec.indexOf(1)).toBe(2);
        expect(exampleNumVec.indexOf(20)).toBe(3);
        expect(exampleNumVec.indexOf(-10)).toBe(-1);
      });

      it('works for "object" dtype too', function() {
        var obj = {a: 1};
        var objVec = jd.vector([1, 'two', obj, null, 'two'], 'object');
        expect(objVec.indexOf('two')).toBe(1);
        expect(objVec.indexOf(obj)).toBe(2);
        expect(objVec.indexOf({})).toBe(-1);
      });
    });

    describe('vector.sort', function() {

      it('behaves as expected without modifying the original vector',
        function() {
          var vector = exampleNumVec.sort();
          expect(vector.dtype).toBe('number');
          expect(vector.values).toEqual([0, 1, 1, 3, 20]);
          expect(exampleNumVec.values).toEqual([3, 0, 1, 20, 1]);
        }
      );
    });

    describe('vector.reverse', function() {

      it('behaves as expected without modifying the original vector',
        function() {
          var vector = exampleNumVec.reverse();
          expect(vector.dtype).toBe('number');
          expect(vector.values).toEqual([1, 20, 1, 0, 3]);
          expect(exampleNumVec.values).toEqual([3, 0, 1, 20, 1]);
        }
      );
    });

    describe('vector.filter', function() {
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

    describe('vector.strJoin', function() {
      it('behaves as expected', function() {
        expect(jd.seq(4).strJoin()).toBe('0,1,2,3');

        expect(jd.vector([true, false, null]).strJoin(' '))
          .toBe('true false null');

        expect(jd.vector([1, NaN, 2]).strJoin('|')).toBe('1|NaN|2');

        expect(jd.seq(1).toDtype('date').strJoin())
          .toBe('1970-01-01T00:00:00.000Z');
      });
    });

    describe('vector.combine', function() {
      var sum = function() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function(x, y) { return x + y; });
      };

      it('behaves as expected for normal usage', function() {
        expect(jd.seq(10, 15).combine(-10, [0, 1, 2, 3, 4], sum).values)
          .toEqual([0, 2, 4, 6, 8]);

        expect(jd.vector(['v']).combine('=', jd.seq(5), '.0', sum).values)
          .toEqual(['v=0.0', 'v=1.0', 'v=2.0', 'v=3.0', 'v=4.0']);
      });

      it('requires all vargs to have compatible lengths', function() {
        expect(function() {
          jd.seq(5).combine(10, jd.seq(3), add);
        }).toThrowError(/length/);
      });

      it('throws an error if "func" is not a function', function() {
        expect(function() {
          jd.seq(5).combine(1, 'not a function');
        }).toThrowError(/function/);
      });

      it('throws an error if there are no vargs', function() {
        expect(function() {
          jd.seq(5).combine(add);
        }).toThrowError(/varg/);
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

    describe('vector.eq', function() {
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

    describe('vector.neq', function() {
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

    describe('vector.lt', function() {
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

    describe('vector.gt', function() {
      it('checks element-wise greater than', function() {
        expect(numberVector.gt(1).values).toEqual(
          [null, false, false, true]
        );
        expect(dateVector.gt(date).values).toEqual(
          [null, false, false, true]
        );
      });
    });

    describe('vector.lte', function() {
      it('checks element-wise less than or equal to', function() {
        expect(numberVector.lte(1).values).toEqual(
          [null, true, true, false]
        );
        expect(dateVector.lte(date).values).toEqual(
          [null, true, true, false]
        );
      });
    });

    describe('vector.gte', function() {
      it('checks element-wise greater than or equal to', function() {
        expect(numberVector.gte(1).values).toEqual(
          [null, false, true, true]
        );
        expect(dateVector.gte(date).values).toEqual(
          [null, false, true, true]
        );
      });
    });

    describe('vector.equals', function() {
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

  describe('order-based methods:', function() {
    var numVec1 = jd.vector([1, 0, 2, NaN, 0, 2]);
    var dateVec1 = numVec1.toDtype('date');

    describe('vector.min', function() {
      it('returns the minimum element', function() {
        expect(numVec1.min()).toBe(0);
        var date = dateVec1.min();
        expect(Object.prototype.toString.call(date)).toBe('[object Date]');
        expect(date.getTime()).toBe(0);
      });

      it('returns missing if skipNa is false and any element is missing',
        function() {
          expect(numVec1.min(false)).toEqual(NaN);
          expect(dateVec1.min(false)).toBe(null);

          expect(jd.seq(5, 10).min(false)).toBe(5);
        }
      );

      it('returns missing if there are no non-missing values', function() {
        expect(jd.vector([], 'number').min()).toEqual(NaN);
        expect(jd.vector([], 'boolean').min(false)).toEqual(null);
        expect(jd.repNa(5, 'string').min()).toBe(null);
      });
    });

    describe('vector.max', function() {
      it('returns the maximum element', function() {
        expect(numVec1.max()).toBe(2);
        var date = dateVec1.max();
        expect(Object.prototype.toString.call(date)).toBe('[object Date]');
        expect(date.getTime()).toBe(2);
      });

      it('returns missing if skipNa is false and any element is missing',
        function() {
          expect(numVec1.max(false)).toEqual(NaN);
          expect(dateVec1.max(false)).toBe(null);

          expect(jd.seq(5, 10).max(false)).toBe(9);
        }
      );

      it('returns missing if there are no non-missing values', function() {
        expect(jd.vector([], 'number').max()).toEqual(NaN);
        expect(jd.vector([], 'boolean').max(false)).toEqual(null);
        expect(jd.repNa(5, 'string').max()).toBe(null);
      });
    });

    describe('vector.cuMin', function() {
      it('returns a vector of cumulative minimums', function() {
        expect(numVec1.cuMin().values).toEqual([1, 0, 0, NaN, 0, 0]);

        var dateVec = dateVec1.cuMin();
        expect(dateVec.dtype).toBe('date');
        expect(dateVec.toDtype('number').values).toEqual([1, 0, 0, NaN, 0, 0]);

        expect(jd.vector([NaN, 1, 2, 0, 3]).cuMin().values).toEqual(
          [NaN, 1, 1, 0, 0]
        );
      });

      it('propagates missing values for all subsequent elements if skipNa ' +
        'is false',
        function() {
          expect(numVec1.cuMin(false).values).toEqual([1, 0, 0, NaN, NaN, NaN]);
        }
      );
    });

    describe('vector.cuMax', function() {
      it('returns a vector of cumulative maximums', function() {
        expect(numVec1.cuMax().values).toEqual([1, 1, 2, NaN, 2, 2]);

        var dateVec = dateVec1.cuMax();
        expect(dateVec.dtype).toBe('date');
        expect(dateVec.toDtype('number').values).toEqual([1, 1, 2, NaN, 2, 2]);

        expect(jd.vector([NaN, 1, 2, 0, 3]).cuMax().values).toEqual(
          [NaN, 1, 2, 2, 3]
        );
      });

      it('propagates missing values for all subsequent elements if skipNa ' +
        'is false',
        function() {
          expect(numVec1.cuMax(false).values).toEqual([1, 1, 2, NaN, NaN, NaN]);
        }
      );
    });

    describe('vector.idxMin', function() {
      it('returns the integer index of the first occurrence of the minimum',
        function() {
          expect(numVec1.idxMin()).toBe(1);
          expect(dateVec1.idxMin()).toBe(1);
        }
      );

      it('returns NaN if skipNa is false and any element is missing',
        function() {
          expect(numVec1.idxMin(false)).toEqual(NaN);
          expect(dateVec1.idxMin(false)).toEqual(NaN);

          expect(jd.seq(5, 10).idxMin(false)).toBe(0);
        }
      );

      it('returns NaN if there are no non-missing values', function() {
        expect(jd.vector([], 'number').idxMin()).toEqual(NaN);
        expect(jd.vector([], 'boolean').idxMin(false)).toEqual(NaN);
        expect(jd.repNa(5, 'string').idxMin()).toEqual(NaN);
      });
    });

    describe('vector.idxMax', function() {
      it('returns the integer index of the first occurrence of the minimum',
        function() {
          expect(numVec1.idxMax()).toBe(2);
          expect(dateVec1.idxMax()).toBe(2);
        }
      );

      it('returns NaN if skipNa is false and any element is missing',
        function() {
          expect(numVec1.idxMax(false)).toEqual(NaN);
          expect(dateVec1.idxMax(false)).toEqual(NaN);

          expect(jd.seq(5, 10).idxMax(false)).toBe(4);
        }
      );

      it('returns NaN if there are no non-missing values', function() {
        expect(jd.vector([], 'number').idxMax()).toEqual(NaN);
        expect(jd.vector([], 'boolean').idxMax(false)).toEqual(NaN);
        expect(jd.repNa(5, 'string').idxMax()).toEqual(NaN);
      });
    });

    var numVec2 = jd.vector([NaN, -1, 1, 3]);
    var dateVec2 = numVec2.toDtype('date');

    describe('vector.pMin', function() {
      it('returns a vector of the element-wise minimums', function() {
        expect(numVec2.pMin(0).values).toEqual([NaN, -1, 0, 0]);
        expect(numVec2.pMin([0, NaN, 2, 2]).values).toEqual([NaN, NaN, 1, 2]);

        var dateVec = dateVec2.pMin(new Date(0));
        expect(dateVec.dtype).toBe('date');
        expect(dateVec.values[0]).toBe(null);
        expect(dateVec.toDtype('number').values).toEqual([NaN, -1, 0, 0]);
      });

      it('throws an error if the dtypes differ', function() {
        expect(function() {
          dateVec2.pMin('string');
        }).toThrowError(/dtype/);
      });
    });

    describe('vector.pMax', function() {
      it('returns a vector of the element-wise maximums', function() {
        expect(numVec2.pMax(0).values).toEqual([NaN, 0, 1, 3]);
        expect(numVec2.pMax([0, NaN, 2, 2]).values).toEqual([NaN, NaN, 2, 3]);

        var dateVec = dateVec2.pMax(new Date(0));
        expect(dateVec.dtype).toBe('date');
        expect(dateVec.values[0]).toBe(null);
        expect(dateVec.toDtype('number').values).toEqual([NaN, 0, 1, 3]);
      });

      it('throws an error if the dtypes differ', function() {
        expect(function() {
          dateVec2.pMax('string');
        }).toThrowError(/dtype/);
      });
    });

    describe('vector.clip', function() {
      it('clips this vector\'s values based on lower and upper', function() {
        expect(numVec2.clip(0, 2).values).toEqual([NaN, 0, 1, 2]);
        expect(numVec2.clip([0, 0, -1, 5], [1, 0, 0, 8]).values).toEqual(
          [NaN, 0, 0, 5]
        );
      });

      it('missing values in lower/upper skip bound checking', function() {
        expect(numVec2.clip(null, 2).values).toEqual([NaN, -1, 1, 2]);
        expect(numVec2.clip(0, null).values).toEqual([NaN, 0, 1, 3]);
        expect(numVec2.clip([0, NaN, -1, 5], [NaN, 0, NaN, 8]).values).toEqual(
          [NaN, -1, 1, 5]
        );
      });

      it('throws an error if the dtypes differ', function() {
        expect(function() {
          dateVec2.clip(0, 1);
        }).toThrowError(/dtype/);
      });

      it('throws an error if lower > upper for any element', function() {
        expect(function() {
          numVec2.clip(5, 0);
        }).toThrowError(/lower/);

        expect(function() {
          numVec2.clip([0, 0, -1, 5], [1, 0, 0, 0]);
        }).toThrowError(/lower/);
      });
    });
  });

  describe('membership methods:', function() {
    var numVec = jd.vector([2, NaN, 0, 2, 2, NaN, 1, 1, NaN, NaN]);
    var dateVec = numVec.toDtype('date');
    var strVec = numVec.toDtype('string');
    var objVec = numVec.toDtype('object');

    it('all membership methods throw an error for object dtypes', function() {
      expect(function() {
        objVec.isIn([1, 2]);
      }).toThrowError(/"object"/);

      var methods = [
        'contains', 'valueCounts', 'unique', 'nUnique', 'duplicated'
      ];
      methods.forEach(function(method) {
        expect(function() {
          objVec[method]();
        }).toThrowError(/"object"/);
      });
    });

    describe('vector.contains', function() {
      it('behaves as expected for the typical case', function() {
        expect(numVec.contains(2)).toBe(true);
        expect(numVec.contains(-1)).toBe(false);
        expect(numVec.contains(NaN)).toBe(true);

        expect(numVec.contains([2])).toBe(true);
        expect(numVec.contains(jd.vector([2]))).toBe(true);

        expect(dateVec.contains(new Date(2))).toBe(true);
        expect(dateVec.contains(new Date(10))).toBe(false);
        expect(dateVec.contains(null)).toBe(true);

        expect(strVec.contains('2')).toBe(true);
        expect(strVec.contains('test')).toBe(false);
        expect(strVec.contains(null)).toBe(true);
      });

      it('throws an error if "values" doesn\'t match the dtype', function() {
        expect(function() {
          numVec.contains('2');
        }).toThrowError(/dtype/);

        expect(function() {
          strVec.contains(2);
        }).toThrowError(/dtype/);

        expect(function() {
          dateVec.contains(2);
        }).toThrowError(/dtype/);
      });

      it('throws an error if "values" is not a scalar', function() {
        expect(function() {
          numVec.contains([1, 2]);
        }).toThrowError(/scalar/);

        expect(function() {
          numVec.contains(jd.seq(2));
        }).toThrowError(/scalar/);

        expect(function() {
          numVec.contains(jd.vector([]));
        }).toThrowError(/scalar/);
      });
    });

    describe('vector.isIn', function() {
      it('behaves as expected for valid vector, array, or scalar "values"',
        function() {
          expect(numVec.isIn(null).values).toEqual(
            [false, true, false, false, false, true, false, false, true, true]
          );
          expect(strVec.isIn(['0', '2', null]).values).toEqual(
            [true, true, true, true, true, true, false, false, true, true]
          );
          expect(dateVec.isIn(jd.seq(3).toDtype('date')).values).toEqual(
            [true, false, true, true, true, false, true, true, false, false]
          );

          var boolVec = numVec.isIn([]);
          expect(boolVec.dtype).toBe('boolean');
          expect(boolVec.values).toEqual(jd.rep(false, 10).values);

          var boolVec2 = jd.vector([], 'number').isIn(10);
          expect(boolVec2.dtype).toBe('boolean');
          expect(boolVec2.values).toEqual([]);
        }
      );

      it ('throws an error if "values" resolves to a different dtype',
        function() {
          expect(function() {
            numVec.isIn('test');
          }).toThrowError(/dtype/);
        }
      );
    });

    describe('vector.valueCounts', function() {
      it('sorts results by decreasing count', function() {
        var expectedDf1 = jd.dfFromMatrixWithHeader([
          ['value', 'count'],
          [NaN, 4],
          [2, 3],
          [1, 2],
          [0, 1],
        ]);
        expect(numVec.valueCounts().equals(expectedDf1)).toBe(true);

        var expectedDf2 = jd.dfFromMatrixWithHeader([
          ['value', 'count'],
          [null, 4],
          ['2', 3],
          ['1', 2],
          ['0', 1],
        ]);
        expect(strVec.valueCounts().equals(expectedDf2)).toBe(true);
      });

      it('resolves ties by sorting values ascending', function() {
        var vector = jd.vector(['a', 'c', 'b', 'b', 'a', 'c', 'd']);
        var expectedDf = jd.dfFromMatrixWithHeader([
          ['value', 'count'],
          ['a', 2],
          ['b', 2],
          ['c', 2],
          ['d', 1],
        ]);
        expect(vector.valueCounts().equals(expectedDf)).toBe(true);
      });
    });

    describe('vector.unique', function() {
      it('behaves as expected', function() {
        var expected = jd.vector([2, NaN, 0, 1]);
        expect(numVec.unique().values).toEqual(expected.values);
        expect(dateVec.unique().values).toEqual(
          expected.toDtype('date').values
        );
        expect(strVec.unique().values).toEqual(
          expected.toDtype('string').values
        );

        expect(jd.seq(3).unique().values).toEqual(jd.seq(3).values);

        var emptyVec = jd.vector([], 'number').unique();
        expect(emptyVec.dtype).toBe('number');
        expect(emptyVec.values).toEqual([]);
      });
    });

    describe('vector.nUnique', function() {
      it('behaves as expected', function() {
        var expected = jd.vector([2, NaN, 0, 1]);
        expect(numVec.nUnique()).toBe(4);
        expect(dateVec.nUnique()).toBe(4);
        expect(strVec.nUnique()).toBe(4);

        expect(jd.seq(3).nUnique()).toBe(3);

        expect(jd.vector([], 'number').nUnique()).toBe(0);
      });
    });

    describe('vector.duplicated', function() {
      it('behaves as expected', function() {
        //var numVec = jd.vector([2, NaN, 0, 2, 2, NaN, 1, 1,   NaN, NaN]);
        [numVec, dateVec, strVec].forEach(function(vector) {
          expect(vector.duplicated().values).toEqual(
            [false, false, false, true, true, true, false, true, true, true]
          );
          expect(vector.duplicated('first').values).toEqual(
            [false, false, false, true, true, true, false, true, true, true]
          );
          expect(vector.duplicated('last').values).toEqual(
            [true, true, false, true, false, true, true, false, true, false]
          );
          expect(vector.duplicated(false).values).toEqual(
            [true, true, false, true, true, true, true, true, true, true]
          );
        });

        expect(jd.seq(3).duplicated().values).toEqual([false, false, false]);

        var emptyVec = jd.vector([], 'number').duplicated();
        expect(emptyVec.dtype).toBe('boolean');
        expect(emptyVec.values).toEqual([]);
      });

      it('throws an error if "keep" isn\'t a recognized value', function() {
        expect(function() {
          numVec.duplicated(true);
        }).toThrowError(/keep/);

        expect(function() {
          numVec.duplicated('unknown option');
        }).toThrowError(/keep/);
      });
    });
  });

  describe('set operations:', function() {

    var vector1 = jd.seq(5);
    var vector2 = jd.seq(3, 8);
    var emptyVec = jd.seq(0);

    var methods = [
      'union', 'intersect', 'setdiff'
    ];

    it('all set operations throw an error for object dtypes', function() {
      var objVec = vector1.toDtype('object');
      methods.forEach(function(method) {
        expect(function() {
          objVec[method](vector2);
        }).toThrowError(/"object"/);
      });
    });

    it('all set operations throw an error for inconsistent dtypes', function() {
      var strVec = vector2.toDtype('string');
      methods.forEach(function(method) {
        expect(function() {
          vector1[method](strVec);
        }).toThrowError(/dtype/);
      });
    });

    describe('vector.union', function() {
      it('works for overlapping sets', function() {
        expect(vector1.union(vector2).equals(jd.seq(8))).toBe(true);
        expect(vector1.union(vector1).equals(vector1)).toBe(true);
        expect(vector1.union([0, 1]).equals(vector1)).toBe(true);
        expect(vector1.union(2).equals(vector1)).toBe(true);
      });

      it('works for non-overlapping sets', function() {
        expect(vector2.union(jd.seq(-3, 0)).values).toEqual([
          3, 4, 5, 6, 7, -3, -2, -1
        ]);
      });

      it('works with empty sets', function() {
        expect(vector1.union(emptyVec).equals(vector1)).toBe(true);
        expect(emptyVec.union(vector1).equals(vector1)).toBe(true);
        expect(emptyVec.union(emptyVec).equals(emptyVec)).toBe(true);
      });

      it('removes any duplicates', function() {
        expect(jd.rep(vector1, 3).union(jd.rep(vector2, 5))
          .equals(jd.seq(8))).toBe(true);
        expect(jd.seq(0).union(jd.rep(vector2, 5)).equals(vector2)).toBe(true);
      });
    });

    describe('vector.intersect', function() {
      it('works for overlapping sets', function() {
        expect(vector1.intersect(vector2).equals(jd.seq(3, 5))).toBe(true);
        expect(vector1.intersect(vector1).equals(vector1)).toBe(true);
      });

      it('returns an empty vector if there are no common elements', function() {
        expect(vector1.intersect([10, 11]).equals(emptyVec)).toBe(true);
        expect(emptyVec.intersect(vector1).equals(emptyVec)).toBe(true);
        expect(emptyVec.intersect(emptyVec).equals(emptyVec)).toBe(true);
      });

      it('removes any duplicates', function() {
        expect(jd.rep(vector1, 3).intersect(jd.rep(vector2, 5))
          .equals(jd.seq(3, 5))).toBe(true);
        expect(jd.rep(vector2, 5).intersect(jd.rep(vector2, 5))
          .equals(vector2)).toBe(true);
      });
    });

    describe('vector.setdiff', function() {
      it('works for overlapping sets', function() {
        expect(vector1.setdiff(vector2).equals(jd.seq(3))).toBe(true);
        expect(vector1.setdiff(vector1).equals(emptyVec)).toBe(true);
      });

      it('works for non-overlapping sets', function() {
        expect(vector1.setdiff([10, 11]).equals(vector1)).toBe(true);
        expect(vector1.setdiff(emptyVec).equals(vector1)).toBe(true);
      });

      it('removes any duplicates', function() {
        expect(jd.rep(vector1, 3).setdiff(jd.rep(vector2, 5))
          .equals(jd.seq(3))).toBe(true);
        expect(jd.rep(vector2, 5).setdiff(10).equals(vector2)).toBe(true);
      });
    });
  });

});
