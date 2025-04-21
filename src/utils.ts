export class SplitError extends Error {
  constructor (message) {
    super(message)
    this.name = 'SplitError'
  }
}


export class InsufficientBalanceError extends SplitError {
  constructor (message) {
    super(message)
    this.name = 'InsufficientBalanceError'
  }
}

export function getSplitting (nantBal, cmBal, cmSrcMin, amount) {
  let split = {nant: 0, cm: 0}

  if (cmBal >= 0) {
    if (cmBal >= amount) {
      split.cm += amount
      return split
    }

    split.cm = cmBal
    amount -= cmBal
    cmBal = 0
  }

  if (nantBal >= amount) {
    split.nant += amount
    return split
  }

  split.nant = nantBal
  amount -= nantBal

  if ((cmBal - cmSrcMin) >= amount) {
    split.cm += amount
    return split
  }
  amount -= (cmBal - cmSrcMin)

  throw new InsufficientBalanceError(`Missing ${amount} to complete amount`)
}


/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe('split', () => {
    it('should split 0 to cm: 0, nant: 0', () => {
      expect(getSplitting(0, 0, 0, 0))
        .toStrictEqual({ nant: 0, cm: 0})
    });
    it('should NOT split 1 with no funds', () => {
      expect(() => getSplitting(0, 0, 0, 1))
        .toThrow("Missing 1 to complete amount")
    });
    // Only Cm
    it('should split 1 to cm: 1, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(getSplitting(0, 2, 0, 1))
        .toStrictEqual({ nant: 0, cm: 1})
    });
    it('should split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(getSplitting(0, 2, 0, 2))
        .toStrictEqual({ nant: 0, cm: 2})
    });
    it('should NOT split 3 with bal cm: 2, nant: 0', () => {
      expect(() => getSplitting(0, 2, 0, 3))
        .toThrow("Missing 1 to complete amount")
    });
    // Only Nant
    it('should split 1 to cm: 0, nant: 1 with bal cm: 0, nant: 2', () => {
      expect(getSplitting(2, 0, 0, 1))
        .toStrictEqual({ nant: 1, cm: 0})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2', () => {
      expect(getSplitting(2, 0, 0, 2))
        .toStrictEqual({ nant: 2, cm: 0})
    });
    it('should NOT split 3 with bal cm: 0, nant: 2', () => {
      expect(() => getSplitting(2, 0, 0, 3))
        .toThrow("Missing 1 to complete amount")
    });
    // Both Nant and Cm
    it('should split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1', () => {
      expect(getSplitting(1, 1, 0, 2))
        .toStrictEqual({ nant: 1, cm: 1})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2 (limSrcCm: -2)', () => {
      expect(getSplitting(2, 0, -2, 2))
        .toStrictEqual({ nant: 2, cm: 0})
    });
    it('should split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(getSplitting(1, 0, -1, 2))
        .toStrictEqual({ nant: 1, cm: 1})
    });
    it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(() => getSplitting(1, 0, -1, 3))
        .toThrow("Missing 1 to complete amount")
    });
    it('should split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1)', () => {
      expect(getSplitting(1, 1, -1, 3))
        .toStrictEqual({ nant: 1, cm: 2})
    });
    // Negative cm bal and limSrcCm
    it('should split 1 to cm: -1, nant: 0 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(getSplitting(0, -1, -2, 1))
        .toStrictEqual({ nant: 0, cm: 1})
    });
    it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(() => getSplitting(0, -1, -2, 2))
        .toThrow("Missing 1 to complete amount")
    });
  });
}
