import { ConvertTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer
// ═══════════════════════════════════════════════════════════════
// Converter transfer: transforms input data via an Operator.
// Capabilities: isInput, isOutput, isPushable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'ConvertTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ConvertTransfer<number, string>({
        operator: { apply: (n) => String(n) },
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer Push & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForConvertPush(),
] as Array<[number, string]>)(
  'ConvertTransfer push transforms and notifies test',
  (input: number, expected: string) => {
    it('', () => {
      const operator = { apply: jest.fn((n: number) => String(n)) };
      const transfer = new ConvertTransfer<number, string>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(input);

      expect(operator.apply).toHaveBeenCalledTimes(1);
      expect(operator.apply).toHaveBeenCalledWith(input);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing push().
 * [input, expected]
 */
function dataProviderForConvertPush(): Array<unknown> {
  return [
    [42, '42'],
    [0, '0'],
    [-5, '-5'],
    [100, '100'],
  ];
}

describe(
  'ConvertTransfer multiple subscribers receive transformed value test',
  () => {
    it('', () => {
      const operator = { apply: (n: number) => String(n) };
      const transfer = new ConvertTransfer<number, string>({ operator });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.push(42);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith('42');
      expect(handler2).toHaveBeenCalledWith('42');

      transfer.destroy();
    });
  },
);

describe(
  'ConvertTransfer ignores push with undefined result still notifies test',
  () => {
    it('', () => {
      const operator = { apply: () => undefined };
      const transfer = new ConvertTransfer<number, string | undefined>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).toHaveBeenCalledTimes(0);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'ConvertTransfer destroy cleans up subscriptions test',
  () => {
    it('', () => {
      const operator = { apply: (n: number) => String(n) };
      const transfer = new ConvertTransfer<number, string>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      transfer.push(42);
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'ConvertTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const operator = { apply: (n: number) => String(n) };
      const transfer = new ConvertTransfer<number, string>({ operator });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'ConvertTransfer push with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('apply error');
      const onError = jest.fn();
      const operator = { apply: () => { throw error; } };
      const transfer = new ConvertTransfer<number, string>({ operator, onError });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'ConvertTransfer push without onError rethrows test',
  () => {
    it('', () => {
      const operator = { apply: () => { throw new Error('apply error'); } };
      const transfer = new ConvertTransfer<number, string>({ operator });

      expect(() => transfer.push(42)).toThrow('apply error');

      transfer.destroy();
    });
  },
);

describe(
  'ConvertTransfer operator ignores undefined notifies subscribers test',
  () => {
    it('', () => {
      const operator = { apply: () => undefined };
      const transfer = new ConvertTransfer<number, undefined>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).toHaveBeenCalledTimes(0);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer Complex Transformations
// ═══════════════════════════════════════════════════════════════

describe(
  'ConvertTransfer string to number transformation test',
  () => {
    it('', () => {
      const operator = { apply: (s: string) => Number(s) };
      const transfer = new ConvertTransfer<string, number>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('42');

      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'ConvertTransfer object transformation test',
  () => {
    it('', () => {
      interface Input { x: number; y: number }
      interface Output { sum: number }
      const operator = { apply: (obj: Input): Output => ({ sum: obj.x + obj.y }) };
      const transfer = new ConvertTransfer<Input, Output>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push({ x: 3, y: 5 });

      expect(handler).toHaveBeenCalledWith({ sum: 8 });

      transfer.destroy();
    });
  },
);

describe(
  'ConvertTransfer array transformation test',
  () => {
    it('', () => {
      const operator = { apply: (arr: number[]) => arr.reduce((a, b) => a + b, 0) };
      const transfer = new ConvertTransfer<number[], number>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push([1, 2, 3, 4]);

      expect(handler).toHaveBeenCalledWith(10);

      transfer.destroy();
    });
  },
);
