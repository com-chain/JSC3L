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

export function getSplitting (amount, bals, cmSrcMin) {
  let split = {nant: 0, cm: 0}

  if (bals.cm >= 0) {
    if (bals.cm >= amount) {
      split.cm += amount
      return split
    }

    split.cm = bals.cm
    amount -= bals.cm
    bals.cm = 0
  }

  if (bals.nant >= amount) {
    split.nant += amount
    return split
  }

  split.nant = bals.nant
  amount -= bals.nant

  if ((bals.cm - cmSrcMin) >= amount) {
    split.cm += amount
    return split
  }
  amount -= (bals.cm - cmSrcMin)

  throw new InsufficientBalanceError(`Missing ${amount} to complete amount`)
}


/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe('split', () => {
    it('should split 0 to cm: 0, nant: 0', () => {
      expect(getSplitting(0, { cm: 0, nant: 0 }, 0))
        .toStrictEqual({ nant: 0, cm: 0})
    });
    it('should NOT split 1 with no funds', () => {
      expect(() => getSplitting(1, { cm: 0, nant: 0 }, 0))
        .toThrow("Missing 1 to complete amount")
    });
    // Only Cm
    it('should split 1 to cm: 1, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(getSplitting(1, {cm: 2, nant: 0}, 0))
        .toStrictEqual({ nant: 0, cm: 1})
    });
    it('should split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(getSplitting(2, { cm: 2, nant: 0 }, 0))
        .toStrictEqual({ nant: 0, cm: 2})
    });
    it('should NOT split 3 with bal cm: 2, nant: 0', () => {
      expect(() => getSplitting(3, { cm: 2, nant: 0 }, 0))
        .toThrow("Missing 1 to complete amount")
    });
    // Only Nant
    it('should split 1 to cm: 0, nant: 1 with bal cm: 0, nant: 2', () => {
      expect(getSplitting(1, { cm: 0, nant: 2 }, 0))
        .toStrictEqual({ nant: 1, cm: 0})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2', () => {
      expect(getSplitting(2, { cm: 0, nant: 2 }, 0))
        .toStrictEqual({ nant: 2, cm: 0})
    });
    it('should NOT split 3 with bal cm: 0, nant: 2', () => {
      expect(() => getSplitting(3, { cm: 0, nant: 2 }, 0))
        .toThrow("Missing 1 to complete amount")
    });
    // Both Nant and Cm
    it('should split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1', () => {
      expect(getSplitting(2, { cm: 1, nant: 1 }, 0))
        .toStrictEqual({ nant: 1, cm: 1})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2 (limSrcCm: -2)', () => {
      expect(getSplitting(2, { cm: 0, nant: 2 }, -2))
        .toStrictEqual({ nant: 2, cm: 0})
    });
    it('should split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(getSplitting(2, { cm: 0, nant: 1 }, -1))
        .toStrictEqual({ nant: 1, cm: 1})
    });
    it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(() => getSplitting(3, { cm: 0, nant: 1 }, -1))
        .toThrow("Missing 1 to complete amount")
    });
    it('should split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1)', () => {
      expect(getSplitting(3, { cm: 1, nant: 1 }, -1))
        .toStrictEqual({ nant: 1, cm: 2})
    });
    // Negative cm bal and limSrcCm
    it('should split 1 to cm: -1, nant: 0 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(getSplitting(1, { cm: -1, nant: 0 }, -2))
        .toStrictEqual({ nant: 0, cm: 1})
    });
    it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(() => getSplitting(2, { cm: -1, nant: 0 }, -2))
        .toThrow("Missing 1 to complete amount")
    });
  });
}
