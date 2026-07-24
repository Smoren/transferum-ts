import { OrderedExecutor } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// OrderedExecutor
// ═══════════════════════════════════════════════════════════════
// Sequential async task executor. Tasks are executed one at a time
// in submission order, regardless of their internal async duration.

describe(
  'OrderedExecutor executes tasks in submission order test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      let resolveA: () => void;
      let resolveB: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });
      const promiseB = new Promise<void>((resolve) => { resolveB = resolve; });

      executor.submit(async () => {
        order.push('start-A');
        await promiseA;
        order.push('end-A');
      });

      executor.submit(async () => {
        order.push('start-B');
        await promiseB;
        order.push('end-B');
      });

      // A is started, B is queued behind A
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(order).toEqual(['start-A']);

      resolveB!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // B cannot start — A is still running
      expect(order).toEqual(['start-A']);

      resolveA!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['start-A', 'end-A', 'start-B', 'end-B']);
    });
  },
);

describe(
  'OrderedExecutor submit returns promise that resolves when task completes test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();

      const p = executor.submit(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });

      expect(p).toBeInstanceOf(Promise);

      // Should resolve after the task completes
      await expect(p).resolves.toBeUndefined();
    });
  },
);

describe(
  'OrderedExecutor submit returns promise that rejects when task throws test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();

      const p = executor.submit(async () => {
        throw new Error('boom');
      });

      // Should reject with the task's error
      await expect(p).rejects.toThrow('boom');
    });
  },
);

describe(
  'OrderedExecutor submit promise resolves in order test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const resolved: string[] = [];

      let resolveA: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });

      const pA = executor.submit(async () => { await promiseA; });
      const pB = executor.submit(async () => {});

      pA.then(() => resolved.push('A'));
      pB.then(() => resolved.push('B'));

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolved).toEqual([]);

      resolveA!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // A resolves first, then B — in submission order
      expect(resolved).toEqual(['A', 'B']);
    });
  },
);

describe(
  'OrderedExecutor does not start second task until first completes test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      let resolveFirst: () => void;
      const promiseFirst = new Promise<void>((resolve) => { resolveFirst = resolve; });

      executor.submit(async () => {
        order.push('first-start');
        await promiseFirst;
        order.push('first-end');
      });

      executor.submit(async () => {
        order.push('second-start');
        order.push('second-end');
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(order).toEqual(['first-start']);

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['first-start', 'first-end', 'second-start', 'second-end']);
    });
  },
);

describe(
  'OrderedExecutor handles empty submit gracefully test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();

      // No tasks — should not throw
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  },
);

describe(
  'OrderedExecutor continues chain after task throws test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      executor.submit(async () => {
        order.push('A');
        throw new Error('task A error');
      }).catch(() => {});

      executor.submit(async () => {
        order.push('B');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both tasks ran despite A throwing — chain not broken
      expect(order).toEqual(['A', 'B']);
    });
  },
);

describe(
  'OrderedExecutor continues chain after multiple task throws test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      executor.submit(async () => {
        order.push('A');
        throw new Error('A error');
      }).catch(() => {});

      executor.submit(async () => {
        order.push('B');
        throw new Error('B error');
      }).catch(() => {});

      executor.submit(async () => {
        order.push('C');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['A', 'B', 'C']);
    });
  },
);

describe(
  'OrderedExecutor reset discards pending tasks test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      let resolveFirst: () => void;
      const promiseFirst = new Promise<void>((resolve) => { resolveFirst = resolve; });

      executor.submit(async () => {
        order.push('A-start');
        await promiseFirst;
        order.push('A-end');
      });

      executor.submit(async () => {
        order.push('B');
      });

      // B is queued behind A
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(order).toEqual(['A-start']);

      // Reset discards the chain — B will never run
      executor.reset();

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // A completes (it was already running), B never starts
      expect(order).toEqual(['A-start', 'A-end']);
    });
  },
);

describe(
  'OrderedExecutor reset allows new tasks after reset test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      let resolveFirst: () => void;
      const promiseFirst = new Promise<void>((resolve) => { resolveFirst = resolve; });

      executor.submit(async () => {
        order.push('A-start');
        await promiseFirst;
        order.push('A-end');
      });

      executor.submit(async () => {
        order.push('B-should-not-run');
      });

      // Let A start (microtask)
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(order).toEqual(['A-start']);

      executor.reset();

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Submit new task after reset
      executor.submit(async () => {
        order.push('C-after-reset');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['A-start', 'A-end', 'C-after-reset']);
    });
  },
);

describe(
  'OrderedExecutor executes three tasks in order test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: number[] = [];

      let resolveA: () => void;
      let resolveB: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });
      const promiseB = new Promise<void>((resolve) => { resolveB = resolve; });

      executor.submit(async () => {
        await promiseA;
        order.push(1);
      });

      executor.submit(async () => {
        await promiseB;
        order.push(2);
      });

      executor.submit(async () => {
        order.push(3);
      });

      // Nothing completed yet
      expect(order).toEqual([]);

      resolveB!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // B resolved but A is still running — nothing emitted
      expect(order).toEqual([]);

      resolveA!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // All three complete in order
      expect(order).toEqual([1, 2, 3]);
    });
  },
);

describe(
  'OrderedExecutor handles sync tasks that return resolved promises test',
  () => {
    it('', async () => {
      const executor = new OrderedExecutor();
      const order: string[] = [];

      executor.submit(async () => {
        order.push('A');
      });

      executor.submit(async () => {
        order.push('B');
      });

      executor.submit(async () => {
        order.push('C');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['A', 'B', 'C']);
    });
  },
);
