import { PendingResultQueue } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PendingResultQueue
// ═══════════════════════════════════════════════════════════════
// Ordered result queue for parallel-then-emit patterns.
// Results are emitted strictly in sequence-number order, regardless
// of the order in which they were submitted.

describe(
  'PendingResultQueue emits results in sequence order test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();

      // Submit out of order: 2, 0, 1
      queue.submit(seq2, 200);
      queue.submit(seq0, 0);
      queue.submit(seq1, 100);

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([0, 100, 200]);
    });
  },
);

describe(
  'PendingResultQueue stops at first gap test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();

      // Submit 0 and 2, but not 1 — gap at seq 1
      queue.submit(seq0, 0);
      queue.submit(seq2, 2);

      queue.drain((value) => emitted.push(value));

      // Only seq 0 is emitted; seq 2 waits behind the gap
      expect(emitted).toEqual([0]);
    });
  },
);

describe(
  'PendingResultQueue resumes after gap is filled test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();

      queue.submit(seq0, 0);
      queue.submit(seq2, 2);

      queue.drain((value) => emitted.push(value));
      expect(emitted).toEqual([0]);

      // Fill the gap
      queue.submit(seq1, 1);
      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([0, 1, 2]);
    });
  },
);

describe(
  'PendingResultQueue drain on empty queue emits nothing test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([]);
    });
  },
);

describe(
  'PendingResultQueue multiple drain calls are idempotent test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();

      queue.submit(seq0, 10);
      queue.submit(seq1, 20);

      queue.drain((value) => emitted.push(value));
      queue.drain((value) => emitted.push(value));

      // Second drain emits nothing — already drained
      expect(emitted).toEqual([10, 20]);
    });
  },
);

describe(
  'PendingResultQueue clear discards all pending results test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();

      queue.submit(seq0, 0);
      queue.submit(seq1, 1);
      queue.submit(seq2, 2);

      queue.clear();

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([]);
    });
  },
);

describe(
  'PendingResultQueue clear resets sequence counters test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();

      queue.submit(seq0, 100);
      queue.submit(seq1, 200);

      queue.clear();

      // After clear, nextSeq starts from 0 again
      const newSeq0 = queue.nextSeq();
      queue.submit(newSeq0, 42);

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([42]);
    });
  },
);

describe(
  'PendingResultQueue handles single element test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<string>();
      const emitted: string[] = [];

      const seq = queue.nextSeq();
      queue.submit(seq, 'hello');

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual(['hello']);
    });
  },
);

describe(
  'PendingResultQueue handles undefined values test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number | undefined>();
      const emitted: (number | undefined)[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();

      // seq1 gets undefined (e.g. operator returned undefined)
      queue.submit(seq0, 1);
      queue.submit(seq1, undefined);
      queue.submit(seq2, 3);

      queue.drain((value) => emitted.push(value));

      // undefined is a valid submitted value — drain emits it
      expect(emitted).toEqual([1, undefined, 3]);
    });
  },
);

describe(
  'PendingResultQueue partial drain then submit more test',
  () => {
    it('', () => {
      const queue = new PendingResultQueue<number>();
      const emitted: number[] = [];

      const seq0 = queue.nextSeq();
      const seq1 = queue.nextSeq();
      const seq2 = queue.nextSeq();
      const seq3 = queue.nextSeq();

      queue.submit(seq0, 0);
      queue.submit(seq1, 1);

      queue.drain((value) => emitted.push(value));
      expect(emitted).toEqual([0, 1]);

      // Submit remaining out of order
      queue.submit(seq3, 3);
      queue.submit(seq2, 2);

      queue.drain((value) => emitted.push(value));

      expect(emitted).toEqual([0, 1, 2, 3]);
    });
  },
);
