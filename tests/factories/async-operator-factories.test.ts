import {
  createAsyncMapOperator,
  createAsyncGuardOperator,
  createAsyncPipelineOperator,
  MapOperator,
  AsyncPipelineOperator,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Async Operator Factories
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// createAsyncMapOperator
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncMapOperator returns correct type test',
  () => {
    it('', () => {
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      expect(operator).toBeDefined();
    });
  },
);

describe(
  'createAsyncMapOperator apply transforms data test',
  () => {
    it('', async () => {
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      const result = await operator.apply(42);
      expect(result).toBe('42');
    });
  },
);

describe.each([
  [1, '1'],
  [42, '42'],
  [-5, '-5'],
] as Array<[number, string]>)(
  'createAsyncMapOperator apply with various values test',
  (input: number, expected: string) => {
    it('', async () => {
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      const result = await operator.apply(input);
      expect(result).toBe(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncGuardOperator
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncGuardOperator returns correct type test',
  () => {
    it('', () => {
      const operator = createAsyncGuardOperator<number>(async (n) => n > 0);

      expect(operator).toBeDefined();
    });
  },
);

describe(
  'createAsyncGuardOperator apply passes valid data test',
  () => {
    it('', async () => {
      const operator = createAsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0));

      const result = await operator.apply(42);
      expect(result).toBe(42);
    });
  },
);

describe(
  'createAsyncGuardOperator apply blocks invalid data test',
  () => {
    it('', async () => {
      const operator = createAsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0));

      const result = await operator.apply(-1);
      expect(result).toBeUndefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncPipelineOperator
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncPipelineOperator returns correct type test',
  () => {
    it('', () => {
      const operator = createAsyncPipelineOperator<number, string>([
        createAsyncMapOperator<number, number>(async (n) => n * 2),
        createAsyncMapOperator<number, string>(async (n) => n.toString()),
      ]);

      expect(operator).toBeDefined();
      expect(operator).toBeInstanceOf(AsyncPipelineOperator);
    });
  },
);

describe(
  'createAsyncPipelineOperator apply chains operators test',
  () => {
    it('', async () => {
      const operator = createAsyncPipelineOperator<number, string>([
        createAsyncMapOperator<number, number>(async (n) => n * 2),
        createAsyncMapOperator<number, string>(async (n) => n.toString()),
      ]);

      const result = await operator.apply(21);
      expect(result).toBe('42');
    });
  },
);

describe(
  'createAsyncPipelineOperator with mixed sync and async operators test',
  () => {
    it('', async () => {
      const operator = createAsyncPipelineOperator<number, string>([
        new MapOperator<number, number>((n) => n + 1),
        createAsyncMapOperator<number, string>(async (n) => `val_${n}`),
      ]);

      const result = await operator.apply(41);
      expect(result).toBe('val_42');
    });
  },
);
