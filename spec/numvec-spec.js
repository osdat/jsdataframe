
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('number vector methods:', function() {
  "use strict";

  describe('operators:', function() {
    var vec = jd.seq(5);

    describe('all number operators', function() {
      var operators = ['add', 'sub', 'mul', 'div', 'mod', 'pow'];

      it('accept a single number for right operand', function() {
        operators.forEach(function(op) {
          expect(vec[op](1).size()).toBe(5);
        });
      });

      it('accept an array of numbers for right operand', function() {
        operators.forEach(function(op) {
          expect(vec[op]([1, 2, 3, 4, 5]).size()).toBe(5);
          expect(vec[op]([1]).size()).toBe(5);
        });
      });

      it('accept a number vector for right operand', function() {
        operators.forEach(function(op) {
          expect(vec[op](jd.seq(1, 6)).size()).toBe(5);
          expect(vec[op](jd.vector([1])).size()).toBe(5);
        });
      });

      it('propagate NaNs from either operand', function() {
        var numVec1 = jd.vector([NaN, NaN, 1]);
        var numVec2 = jd.vector([NaN, 1, NaN]);

        operators.forEach(function(op) {
          expect(numVec1[op](numVec2).values).toEqual([NaN, NaN, NaN]);
        });
      });

      it('throw an error for right operands with the wrong dtype', function() {
        operators.forEach(function(op) {
          expect(function() {
            vec[op]('string');
          }).toThrowError(/dtype/);

          expect(function() {
            vec[op](['string']);
          }).toThrowError(/dtype/);
        });
      });

      it('throw an error for right operands of the wrong size', function() {
        operators.forEach(function(op) {
          expect(function() {
            vec[op]([1, 2, 3]);
          }).toThrowError(/length/);

          expect(function() {
            vec[op](jd.seq(1, 10));
          }).toThrowError(/length/);
        });
      });
    });

    describe('numVec.add', function() {
      it('performs element-wise addition', function() {
        expect(vec.add(5).values).toEqual(jd.seq(5, 10).values);
        expect(vec.add(vec).values).toEqual([0, 2, 4, 6, 8]);
      });
    });

    describe('numVec.sub', function() {
      it('performs element-wise subtraction', function() {
        expect(vec.sub(5).values).toEqual(jd.seq(-5, 0).values);
        expect(vec.sub(vec).values).toEqual(jd.rep(0, 5).values);
      });
    });

    describe('numVec.mul', function() {
      it('performs element-wise multiplication', function() {
        expect(vec.mul(-1).equals(jd.vector([0, -1, -2, -3, -4]))).toBe(true);
        expect(vec.mul(vec).values).toEqual([0, 1, 4, 9, 16]);
      });
    });

    describe('numVec.div', function() {
      it('performs element-wise division', function() {
        expect(vec.div(4).values).toEqual([0, 0.25, 0.5, 0.75, 1]);
        expect(vec.div(vec).values).toEqual([NaN, 1, 1, 1, 1]);
      });
    });

    describe('numVec.mod', function() {
      it('performs element-wise modulo', function() {
        expect(vec.mod(2).values).toEqual([0, 1, 0, 1, 0]);
        expect(vec.mod(vec).values).toEqual([NaN, 0, 0, 0, 0]);
      });
    });

    describe('numVec.pow', function() {
      it('performs element-wise power', function() {
        expect(vec.pow(2).values).toEqual([0, 1, 4, 9, 16]);
        expect(vec.pow(vec).values).toEqual([1, 1, 4, 27, 256]);
      });
    });
  });

  describe('unary functions:', function() {
    var piVec = jd.vector([-Math.PI, -Math.PI/2, 0, Math.PI/2, Math.PI, NaN]);

    describe('numVec.abs', function() {
      it('behaves as expected', function() {
        expect(piVec.abs().values).toEqual(
          [Math.PI, Math.PI/2, 0, Math.PI/2, Math.PI, NaN]
        );
      });
    });

    describe('numVec.sqrt', function() {
      it('behaves as expected', function() {
        expect(piVec.sqrt().values).toEqual(
          [NaN, NaN, 0, Math.sqrt(Math.PI/2), Math.sqrt(Math.PI), NaN]
        );
      });
    });

    describe('numVec.sign', function() {
      it('behaves as expected', function() {
        expect(piVec.sign().values).toEqual(
          [-1, -1, 0, 1, 1, NaN]
        );
      });
    });

    describe('numVec.ceil', function() {
      it('behaves as expected', function() {
        expect(piVec.ceil().values).toEqual(
          [-3, -1, 0, 2, 4, NaN]
        );
      });
    });

    describe('numVec.floor', function() {
      it('behaves as expected', function() {
        expect(piVec.floor().values).toEqual(
          [-4, -2, 0, 1, 3, NaN]
        );
      });
    });

    describe('numVec.round', function() {
      it('behaves as expected', function() {
        expect(piVec.round().values).toEqual(
          [-3, -2, 0, 2, 3, NaN]
        );
      });
    });

    describe('numVec.exp', function() {
      it('behaves as expected', function() {
        expect(jd.vector([-1, 0, 1, NaN]).exp().equals(
          jd.vector([1/Math.E, 1, Math.E, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.log', function() {
      it('behaves as expected', function() {
        expect(jd.vector([1/Math.E, 1, Math.E, NaN]).log().equals(
          jd.vector([-1, 0, 1, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.sin', function() {
      it('behaves as expected', function() {
        expect(piVec.sin().equals(
          jd.vector([0, -1, 0, 1, 0, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.cos', function() {
      it('behaves as expected', function() {
        expect(piVec.cos().equals(
          jd.vector([-1, 0, 1, 0, -1, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.tan', function() {
      it('behaves as expected', function() {
        expect(jd.vector([-Math.PI/4, 0, Math.PI/4, NaN]).tan().equals(
          jd.vector([-1, 0, 1, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.asin', function() {
      it('behaves as expected', function() {
        expect(jd.vector([-1, 0, 1, NaN]).asin().equals(
          jd.vector([-Math.PI/2, 0, Math.PI/2, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.acos', function() {
      it('behaves as expected', function() {
        expect(jd.vector([-1, 0, 1, NaN]).acos().equals(
          jd.vector([Math.PI, Math.PI/2, 0, NaN])
        )).toBe(true);
      });
    });

    describe('numVec.atan', function() {
      it('behaves as expected', function() {
        expect(jd.vector([-1, 0, 1, NaN]).atan().equals(
          jd.vector([-Math.PI/4, 0, Math.PI/4, NaN])
        )).toBe(true);
      });
    });
  });

  describe('aggregation:', function() {
    var vec = jd.vector([4, 7, NaN, 13, 16]);

    describe('all aggregation methods', function() {
      var methods = ['sum', 'mean', 'stdev', 'var'];

      it('return NaN if there are any NaN elements and "skipNa" is false',
        function() {
          methods.forEach(function(method) {
            expect(vec[method](false)).toEqual(NaN);
          });
        }
      );

      it('have "skipNa" true by default', function() {
        methods.forEach(function(method) {
          expect(vec[method]()).not.toEqual(NaN);
        });
      });
    });

    describe('numVec.sum', function() {
      it('returns the sum of elements', function() {
        expect(vec.sum()).toBeCloseTo(40, 10);
        expect(jd.vector([10]).sum()).toBe(10);
      });

      it('returns 0 if there are no elements to sum', function() {
        expect(jd.repNa(5, 'number').sum()).toBe(0);
        expect(jd.repNa(0, 'number').sum(false)).toBe(0);
      });
    });

    describe('numVec.cuSum', function() {
      it('returns a vector of cumulative sums', function() {
        expect(vec.cuSum().values).toEqual([4, 11, NaN, 24, 40]);
      });

      it('propagates missing values for all subsequent elements if "skipNa" ' +
        'is false',
        function() {
          expect(vec.cuSum(false).values).toEqual([4, 11, NaN, NaN, NaN]);
        }
      );
    });

    describe('numVec.mean', function() {
      it('returns the mean of the elements', function() {
        expect(vec.mean()).toBeCloseTo(10, 10);
        expect(jd.vector([10]).mean()).toBe(10);
      });

      it('returns NaN if there are no non-ignored elements', function() {
        expect(jd.repNa(5, 'number').mean()).toEqual(NaN);
        expect(jd.repNa(0, 'number').mean(false)).toEqual(NaN);
      });
    });

    describe('numVec.stdev', function() {
      it('returns the standard deviation of the elements', function() {
        expect(vec.stdev()).toBeCloseTo(Math.sqrt(30), 8);
        expect(jd.vector([10, 10]).stdev()).toBe(0);
      });

      it('returns NaN if there are fewer than 2 non-ignored elemetns',
        function() {
          expect(jd.vector([NaN, 1, NaN]).stdev()).toEqual(NaN);
          expect(jd.repNa(0, 'number').stdev()).toEqual(NaN);
        }
      );
    });

    describe('numVec.var', function() {
      it('returns the variance of the elements', function() {
        expect(vec.var()).toBeCloseTo(30, 8);
        expect(vec.add(1e9).var()).toBeCloseTo(30, 8);
        expect(jd.vector([10, 10]).var()).toBe(0);
      });

      it('returns NaN if there are fewer than 2 non-ignored elemetns',
        function() {
          expect(jd.vector([NaN, 1, NaN]).var()).toEqual(NaN);
          expect(jd.repNa(0, 'number').var()).toEqual(NaN);
        }
      );
    });
  });
});
