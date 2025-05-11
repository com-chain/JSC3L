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

export class CmSpendLimitError extends SplitError {
  constructor (message) {
    super(message)
    this.name = 'CmSpendLimitError'
  }
}


function min(a, b) {
  return a < b ? a : b
}


export let getSplitting = function (amount, bals, cmSrcMin, cmSpendMax = null) {

  const zero = amount - amount  // Required for agnosticity

  const split = { nant: zero, cm: zero }
  let cmPosSpendMax = cmSpendMax !== null ? min(bals.cm, cmSpendMax) : bals.cm

  if (cmPosSpendMax >= 0) {
    if (cmPosSpendMax >= amount) {
      split.cm += amount
      return split
    }
    split.cm += cmPosSpendMax
    amount -= cmPosSpendMax
    bals.cm -= cmPosSpendMax
    if (cmSpendMax !== null) {
      cmSpendMax -= cmPosSpendMax
    }
  }

  if (bals.nant >= amount) {
    split.nant += amount
    return split
  }

  split.nant = bals.nant
  amount -= bals.nant

  let cmNegAvailable = (bals.cm - cmSrcMin)
  let cmNegSpendMax = cmSpendMax !== null ? min(cmNegAvailable, cmSpendMax) : cmNegAvailable
  if (cmNegSpendMax >= amount) {
    split.cm += amount
    return split
  }

  amount -= cmNegSpendMax
  bals.cm -= cmNegSpendMax
  if (cmSpendMax !== null) {
    cmSpendMax -= cmNegSpendMax
  }

  cmNegAvailable = (bals.cm - cmSrcMin)
  if (cmNegAvailable >= amount && cmSpendMax == 0) {
    throw new CmSpendLimitError(`Cm spend limit preventing to complete amount (remaining: ${amount}).`)
  }

  throw new InsufficientBalanceError(`Missing ${amount - cmNegAvailable} to complete amount`)
}


/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe, beforeAll, afterAll } = import.meta.vitest

  function testSuite (numberFactory: any = null, label: any = null) {
    let msg
    if (numberFactory) {
      msg = `check with ${label}`
    } else {
      msg = "check with standard number"
    }
    describe(msg, () => {

      let getSplittingOrig = getSplitting
      let toStrictEqual

      beforeAll(() => {

        if (numberFactory) {
          getSplitting = function (amount, bals, cmSrcMin, cmSpendMax = null) {
            amount = numberFactory(amount)
            bals.cm = numberFactory(bals.cm)
            bals.nant = numberFactory(bals.nant)
            cmSrcMin = numberFactory(cmSrcMin)
            if (cmSpendMax !== null) {
              cmSpendMax = numberFactory(cmSpendMax)
            }
            return getSplittingOrig(amount, bals, cmSrcMin, cmSpendMax)
          }
          toStrictEqual = function (actual, expected) {
            let { cm, nant } = expected
            expect(actual).toStrictEqual({ cm: numberFactory(cm), nant: numberFactory(nant) })
          }
        } else {
          toStrictEqual = function (actual, expected) {
            expect(actual).toStrictEqual(expected)
          }
        }
      })

      afterAll(() => {
        getSplitting = getSplittingOrig
      })


      describe('split without cmSpendMax', () => {
        it('should split 0 to cm: 0, nant: 0', () => {
          toStrictEqual(getSplitting(0, { cm: 0, nant: 0 }, 0), { nant: 0, cm: 0 })
        });
        it('should NOT split 1 with no funds', () => {
          expect(() => getSplitting(1, { cm: 0, nant: 0 }, 0))
            .toThrow("Missing 1 to complete amount")
        });
        // Only Cm
        it('should split 1 to cm: 1, nant: 0 with bal cm: 2, nant: 0', () => {
          toStrictEqual(getSplitting(1, {cm: 2, nant: 0}, 0), { nant: 0, cm: 1 })
        });
        it('should split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0', () => {
          toStrictEqual(getSplitting(2, { cm: 2, nant: 0 }, 0), { nant: 0, cm: 2 })
        });
        it('should NOT split 3 with bal cm: 2, nant: 0', () => {
          expect(() => getSplitting(3, { cm: 2, nant: 0 }, 0))
            .toThrow("Missing 1 to complete amount")
        });
        // Only Nant
        it('should split 1 to cm: 0, nant: 1 with bal cm: 0, nant: 2', () => {
          toStrictEqual(getSplitting(1, { cm: 0, nant: 2 }, 0), { nant: 1, cm: 0 })
        });
        it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2', () => {
          toStrictEqual(getSplitting(2, { cm: 0, nant: 2 }, 0), { nant: 2, cm: 0 })
        });
        it('should NOT split 3 with bal cm: 0, nant: 2', () => {
          expect(() => getSplitting(3, { cm: 0, nant: 2 }, 0))
            .toThrow("Missing 1 to complete amount")
        });
        // Both Nant and Cm
        it('should split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1', () => {
          toStrictEqual(getSplitting(2, { cm: 1, nant: 1 }, 0), { nant: 1, cm: 1 })
        });
        it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2 (limSrcCm: -2)', () => {
          toStrictEqual(getSplitting(2, { cm: 0, nant: 2 }, -2), { nant: 2, cm: 0 })
        });
        it('should split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
          toStrictEqual(getSplitting(2, { cm: 0, nant: 1 }, -1), { nant: 1, cm: 1 })
        });
        it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
          expect(() => getSplitting(3, { cm: 0, nant: 1 }, -1))
            .toThrow("Missing 1 to complete amount")
        });
        it('should split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1)', () => {
          toStrictEqual(getSplitting(3, { cm: 1, nant: 1 }, -1), { nant: 1, cm: 2 })
        });
        // Negative cm bal and limSrcCm
        it('should split 1 to cm: -1, nant: 0 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
          toStrictEqual(getSplitting(1, { cm: -1, nant: 0 }, -2), { nant: 0, cm: 1 })
        });
        it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
          expect(() => getSplitting(2, { cm: -1, nant: 0 }, -2))
            .toThrow("Missing 1 to complete amount")
        });
      });
      describe('split with cmSpendMax', () => {
        it('should split 0 to cm: 0, nant: 0 (cmSpendMax: 0)', () => {
          toStrictEqual(getSplitting(0, { cm: 0, nant: 0 }, 0, 0), { nant: 0, cm: 0})
        });
        it('should split 0 to cm: 0, nant: 0 (cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(0, { cm: 0, nant: 0 }, 0, 0), { nant: 0, cm: 0})
        });
        it('should NOT split 1 with no funds (cmSpendMax: 1)', () => {
          expect(() => getSplitting(1, { cm: 0, nant: 0 }, 0, 1))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 1 with no funds (cmSpendMax: 0)', () => {
          expect(() => getSplitting(1, { cm: 0, nant: 0 }, 0, 0))
            .toThrow("Missing 1 to complete amount")
        });
        // Only Cm
        it('should split 1 to cm: 1, nant: 0 with bal cm: 2, nant: 0 (cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(1, {cm: 2, nant: 0}, 0, 1), { nant: 0, cm: 1 })
        });
        it('should split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0 (cmSpendMax: 2)', () => {
          toStrictEqual(getSplitting(2, { cm: 2, nant: 0 }, 0, 2), { nant: 0, cm: 2 })
        });
        it('should NOT split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0 (cmSpendMax: 1)', () => {
          expect(() => getSplitting(2, { cm: 2, nant: 0 }, 0, 1))
            .toThrow("Cm spend limit preventing to complete amount (remaining: 1)")
        });
        it('should NOT split 3 with bal cm: 2, nant: 0 (cmSpendMax: 5)', () => {
          expect(() => getSplitting(3, { cm: 2, nant: 0 }, 0, 5))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 3 with bal cm: 2, nant: 0 (cmSpendMax: 2)', () => {
          expect(() => getSplitting(3, { cm: 2, nant: 0 }, 0, 2))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 3 with bal cm: 2, nant: 0 (cmSpendMax: 1)', () => {
          expect(() => getSplitting(3, { cm: 2, nant: 0 }, 0, 1))
            .toThrow("Missing 1 to complete amount")
        });
        // Only Nant
        it('should split 1 to cm: 0, nant: 1 with bal cm: 0, nant: 2 (cmSpendMax: 0)', () => {
          toStrictEqual(getSplitting(1, { cm: 0, nant: 2 }, 0, 0), { nant: 1, cm: 0 })
        });
        it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2 (cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(2, { cm: 0, nant: 2 }, 0, 1), { nant: 2, cm: 0 })
        });
        it('should NOT split 3 with bal cm: 0, nant: 2 (cmSpendMax: 0)', () => {
          expect(() => getSplitting(3, { cm: 0, nant: 2 }, 0, 0))
            .toThrow("Missing 1 to complete amount")
        });
        // Both Nant and Cm
        it('should split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1 (cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(2, { cm: 1, nant: 1 }, 0, 1), { nant: 1, cm: 1})
        });
        it('should NOT split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1 (cmSpendMax: 0)', () => {
          expect(() => getSplitting(2, { cm: 1, nant: 1 }, 0, 0))
            .toThrow("Cm spend limit preventing to complete amount (remaining: 1)")
        });
        it('should split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1, cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(2, { cm: 0, nant: 1 }, -1, 1), { nant: 1, cm: 1})
        });
        it('should NOT split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1, cmSpendMax: 0)', () => {
          expect(() => getSplitting(2, { cm: 0, nant: 1 }, -1, 0))
            .toThrow("Cm spend limit preventing to complete amount (remaining: 1)")
        });
        it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1, cmSpendMax: 5)', () => {
          expect(() => getSplitting(3, { cm: 0, nant: 1 }, -1, 5))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1, cmSpendMax: 0)', () => {
          expect(() => getSplitting(3, { cm: 0, nant: 1 }, -1, 0))
            .toThrow("Missing 1 to complete amount")
        });
        it('should split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1, cmSpendMax: 2)', () => {
          toStrictEqual(getSplitting(3, { cm: 1, nant: 1 }, -1, 2), { nant: 1, cm: 2 })
        });
        it('should NOT split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1, cmSpendMax: 1)', () => {
          expect(() => getSplitting(3, { cm: 1, nant: 1 }, -1, 1))
            .toThrow("Cm spend limit preventing to complete amount (remaining: 1)")
        });
        // If the recipient can't receive cm, then pay with nant if possible.
        it('should split 2 to cm: 0, nant: 2 with bal cm: 2, nant: 2 (limSrcCm: 0, cmSpendMax: 0)', () => {
          toStrictEqual(getSplitting(2, { cm: 2, nant: 2 }, 0, 0), { nant: 2, cm: 0 })
        });
        it('should split 3 to cm: 1, nant: 2 with bal cm: 2, nant: 2 (limSrcCm: 0, cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(3, { cm: 2, nant: 2 }, 0, 1), { nant: 2, cm: 1 })
        });
        it('should split 3 to cm: 2, nant: 2 with bal cm: 2, nant: 2 (limSrcCm: 0, cmSpendMax: 2)', () => {
          toStrictEqual(getSplitting(3, { cm: 2, nant: 2 }, 0, 2), { nant: 1, cm: 2 })
        });
        // Negative cm bal and limSrcCm
        it('should split 1 to cm: -1, nant: 0 with bal cm: -1, nant: 0 (limSrcCm: -2, cmSpendMax: 1)', () => {
          toStrictEqual(getSplitting(1, { cm: -1, nant: 0 }, -2, 1), { nant: 0, cm: 1 })
        });
        it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2, cmSpendMax: 2)', () => {
          expect(() => getSplitting(2, { cm: -1, nant: 0 }, -2, 2))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2, cmSpendMax: 0)', () => {
          expect(() => getSplitting(2, { cm: -1, nant: 0 }, -2, 2))
            .toThrow("Missing 1 to complete amount")
        });
        it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -3, cmSpendMax: 1)', () => {
          expect(() => getSplitting(2, { cm: -1, nant: 0 }, -3, 1))
            .toThrow("Cm spend limit preventing to complete amount (remaining: 1)")
        });
      })
    })
  }
  testSuite()
  testSuite(BigInt, "BigInt")
}
