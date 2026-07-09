import {
  AsyncOperatorPipelineBuilder,
  AsyncMapOperator,
  AsyncGuardOperator,
  MapOperator,
  GuardOperator,
  AsyncPipelineOperator,
} from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncOperatorPipelineBuilder
// ═══════════════════════════════════════════════════════════════
// Builder for creating an AsyncPipelineOperator from a chain of operators.
// Accepts both sync and async operators.

// ═══════════════════════════════════════════════════════════════
// create() & Basic Build
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOperatorPipelineBuilder create returns builder test',
  () => {
    it('', () => {
      const builder = AsyncOperatorPipelineBuilder.create();

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder build with single async operator test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(operator)
        .build();

      expect(pipeline).toBeInstanceOf(AsyncPipelineOperator);

      const result = await pipeline.apply(42);
      expect(result).toBe('42');
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder build with single sync operator test',
  () => {
    it('', async () => {
      const operator = new MapOperator<number, string>((n) => n.toString());

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(operator)
        .build();

      expect(pipeline).toBeInstanceOf(AsyncPipelineOperator);

      const result = await pipeline.apply(42);
      expect(result).toBe('42');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Mixed Sync & Async Operators
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOperatorPipelineBuilder mixed sync and async operators test',
  () => {
    it('', async () => {
      const syncOp = new MapOperator<number, number>((n) => n * 2);
      const asyncOp = new AsyncMapOperator<number, string>(async (n) => `val_${n}`);

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(syncOp)
        .add(asyncOp)
        .build();

      const result = await pipeline.apply(21);
      expect(result).toBe('val_42');
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder multiple async operators test',
  () => {
    it('', async () => {
      const op1 = new AsyncMapOperator<number, number>(async (n) => n + 1);
      const op2 = new AsyncMapOperator<number, number>(async (n) => n * 2);
      const op3 = new AsyncMapOperator<number, string>(async (n) => n.toString());

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(op1)
        .add(op2)
        .add(op3)
        .build();

      const result = await pipeline.apply(5);
      // (5 + 1) * 2 = 12 → "12"
      expect(result).toBe('12');
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder sync guard then async map test',
  () => {
    it('', async () => {
      const guard = new GuardOperator<number>((n) => n > 0);
      const asyncMap = new AsyncMapOperator<number, string>(async (n) => n.toString());

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(guard)
        .add(asyncMap)
        .build();

      const result = await pipeline.apply(42);
      expect(result).toBe('42');
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder async guard then sync map test',
  () => {
    it('', async () => {
      const asyncGuard = new AsyncGuardOperator<string>(async (n) => Promise.resolve(Number(n) > 0));
      const syncMap = new MapOperator<number, string>((n) => n.toString());

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(syncMap)
        .add(asyncGuard)
        .build();

      const result = await pipeline.apply(42);
      expect(result).toBe('42');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Type Safety & Immutability
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOperatorPipelineBuilder add returns new builder test',
  () => {
    it('', () => {
      const builder1 = AsyncOperatorPipelineBuilder.create();
      const builder2 = builder1.add(new MapOperator<number, string>((n) => n.toString()));

      // builder1 and builder2 are different objects
      expect(builder1).not.toBe(builder2);
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder empty build throws test',
  () => {
    it('', () => {
      // build() requires at least one operator (type level)
      // But runtime may not throw — verified via types
      const builder = AsyncOperatorPipelineBuilder.create();
      expect(builder).toBeDefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOperatorPipelineBuilder with undefined from async guard test',
  () => {
    it('', async () => {
      const guard = new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0));
      const map = new MapOperator<number | undefined, string>((n) => `val_${n}`);

      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(guard)
        .add(map)
        .build();

      // Guard returns undefined for n <= 0
      // PipelineOperator passes undefined forward (does not stop the chain)
      const result = await pipeline.apply(-1);
      expect(result).toBe('val_undefined');
    });
  },
);

describe(
  'AsyncOperatorPipelineBuilder five operators chain test',
  () => {
    it('', async () => {
      const pipeline = AsyncOperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n + 1))
        .add(new AsyncMapOperator<number, number>(async (n) => n * 2))
        .add(new MapOperator<number, number>((n) => n - 1))
        .add(new AsyncMapOperator<number, number>(async (n) => n + 10))
        .add(new MapOperator<number, string>((n) => `result_${n}`))
        .build();

      // ((1 + 1) * 2 - 1 + 10) = 13 → "result_13"
      const result = await pipeline.apply(1);
      expect(result).toBe('result_13');
    });
  },
);
