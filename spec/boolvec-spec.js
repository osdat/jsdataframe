
if (typeof jsdataframe === 'undefined') {
  var jsdataframe = require('..');
}
var jd = jsdataframe;

describe('boolean vector methods:', function() {
  "use strict";

  var p = jd.vector([true, true, false, false, true, false, null, null, null]);
  var q = jd.vector([true, false, true, false, null, null, true, false, null]);
  var r = jd.vector([true, false, null]);

  describe('all boolean operators (and, or, xor)', function() {
    var operators = ['and', 'or', 'xor'];

    it('accept a single boolean for right operand', function() {
      operators.forEach(function(op) {
        expect(r[op](true).size()).toBe(3);
        expect(r[op](jd.vector([true])).size()).toBe(3);
      });
    });

    it('accept an array of booleans for right operand', function() {
      operators.forEach(function(op) {
        expect(r[op]([null, false, true]).size()).toBe(3);
      });
    });

    it('infer boolean dtype for null right operand', function() {
      operators.forEach(function(op) {
        expect(r[op](null).size()).toBe(3);
        expect(r[op]([null, null, null]).size()).toBe(3);
      });
    });

    it('throw an error for right operands that aren\'t boolean', function() {
      operators.forEach(function(op) {
        expect(function() {
          r[op]('string');
        }).toThrowError(/boolean/);

        expect(function() {
          r[op]([1, 2, 3]);
        }).toThrowError(/boolean/);

        expect(function() {
          r[op](jd.rep(1, 3));
        }).toThrowError(/boolean/);
      });
    });

    it('throw an error for right operands of the wrong size', function() {
      operators.forEach(function(op) {
        expect(function() {
          r[op]([true, false]);
        }).toThrowError(/length/);

        expect(function() {
          r[op](jd.rep(true, 5));
        }).toThrowError(/length/);
      });
    });
  });

  describe('boolVec.and', function() {
    it('performs element-wise boolean "and"', function() {
      expect(p.and(q).values).toEqual(
        [true, false, false, false, null, false, null, false, null]
      );
    });
  });

  describe('boolVec.or', function() {
    it('performs element-wise boolean "or"', function() {
      expect(p.or(q).values).toEqual(
        [true, true, true, false, true, null, true, null, null]
      );
    });
  });

  describe('boolVec.not', function() {
    it('performs element-wise boolean negation', function() {
      expect(r.not().values).toEqual(
        [false, true, null]
      );
    });
  });

  describe('boolVec.xor', function() {
    it('performs element-wise boolean "exclusive or"', function() {
      expect(p.xor(q).values).toEqual(
        [false, true, true, false, null, null, null, null, null]
      );
    });
  });

  describe('boolVec.all', function() {
    it('returns false if any element is false', function() {
      expect(r.all()).toBe(false);
    });

    it('skipNa is false by default, but if true missing values are ignored',
      function() {
        expect(jd.vector([true, null]).all()).toBe(null);
        expect(jd.vector([true, null]).all(true)).toBe(true);
      }
    );

    it('returns true if there aren\'t any non-ignored elements',
      function() {
        expect(jd.vector([], 'boolean').all()).toBe(true);
        expect(jd.repNa(5, 'boolean').all(true)).toBe(true);
      }
    );
  });

  describe('boolVec.any', function() {
    it('returns true if any element is true', function() {
      expect(r.any()).toBe(true);
    });

    it('skipNa is false by default, but if true missing values are ignored',
      function() {
        expect(jd.vector([false, null]).any()).toBe(null);
        expect(jd.vector([false, null]).any(true)).toBe(false);
      }
    );

    it('returns false if there aren\'t any non-ignored elements',
      function() {
        expect(jd.vector([], 'boolean').any()).toBe(false);
        expect(jd.repNa(5, 'boolean').any(true)).toBe(false);
      }
    );
  });

  describe('boolVec.sum', function() {
    it('returns the number of true elements', function() {
      expect(q.sum()).toBe(3);
      expect(jd.vector([true]).sum()).toBe(1);
      expect(jd.vector([], 'boolean').sum()).toBe(0);
    });

    it('skipNa is true by default, but if false any missing value will ' +
      'make the whole result NaN',
      function() {
        expect(r.sum()).toBe(1);
        expect(r.sum(false)).toEqual(NaN);
      }
    );
  });

  describe('boolVec.which', function() {
    it('returns the integer indices of the true elements only', function() {
      var indices = q.which();
      expect(indices.dtype).toBe('number');
      expect(indices.values).toEqual([0, 2, 6]);

      var indices2 = jd.vector([false, null, false]).which();
      expect(indices2.dtype).toBe('number');
      expect(indices2.values).toEqual([]);
    });
  });
});
