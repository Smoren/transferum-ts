import {
  createLatestStorage,
  createQueueStorage,
  createStackStorage,
  createWriteTransfer,
  createReadTransfer,
  createPollingFlowTransfer,
  createSinkTransfer,
  LatestStorage,
  QueueStorage,
  StackStorage,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createLatestStorage
// ═══════════════════════════════════════════════════════════════

describe.each([
  [0, 0],
  [42, 42],
  ['hello', 'hello'],
  [null, null],
  [{ a: 1 }, { a: 1 }],
  [[1, 2, 3], [1, 2, 3]],
] as Array<[unknown, unknown]>)(
  'createLatestStorage write and read test',
  (input, expected) => {
    it('', () => {
      const storage = createLatestStorage<unknown>();
      storage.write(input);
      expect(storage.read()).toEqual(expected);
    });
  },
);

describe(
  'createLatestStorage overwrites previous value test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);
      expect(storage.read()).toBe(3);
    });
  },
);

describe(
  'createLatestStorage size test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>();
      expect(storage.size).toBe(0);

      storage.write(42);
      expect(storage.size).toBe(1);

      storage.write(100);
      expect(storage.size).toBe(1);
    });
  },
);

describe(
  'createLatestStorage read empty returns undefined test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>();
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createLatestStorage with default value test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>(0);
      expect(storage.read()).toBe(0);
      expect(storage.size).toBe(1);
    });
  },
);

describe(
  'createLatestStorage clear test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>();
      storage.write(42);
      storage.clear();
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createLatestStorage reset to default test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>(10);
      storage.write(99);
      expect(storage.read()).toBe(99);
      storage.reset();
      expect(storage.read()).toBe(10);
    });
  },
);

describe(
  'createLatestStorage reset without default test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>();
      storage.write(99);
      storage.reset();
      expect(storage.read()).toBeUndefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createQueueStorage
// ═══════════════════════════════════════════════════════════════

describe.each([
  [[1, 2, 3], 1],
  [[42], 42],
  [['a', 'b', 'c'], 'a'],
] as Array<[unknown[], unknown]>)(
  'createQueueStorage FIFO order test',
  (input, expected) => {
    it('', () => {
      const storage = createQueueStorage<unknown>();
      input.forEach((item) => storage.write(item));
      expect(storage.read()).toEqual(expected);
    });
  },
);

describe(
  'createQueueStorage read from empty returns undefined test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createQueueStorage size test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      expect(storage.size).toBe(0);

      storage.write(1);
      storage.write(2);
      storage.write(3);
      expect(storage.size).toBe(3);

      storage.read();
      expect(storage.size).toBe(2);
    });
  },
);

describe(
  'createQueueStorage drains all elements test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);

      expect(storage.read()).toBe(1);
      expect(storage.read()).toBe(2);
      expect(storage.read()).toBe(3);
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createQueueStorage clear test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.clear();
      expect(storage.size).toBe(0);
      expect(storage.read()).toBeUndefined();
    });
  },
);

describe(
  'createQueueStorage reset test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.reset();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createQueueStorage with maxLength evicts oldest test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>(3);
      storage.write(1);
      storage.write(2);
      storage.write(3);
      storage.write(4); // evicts 1

      expect(storage.size).toBe(3);
      expect(storage.read()).toBe(2);
      expect(storage.read()).toBe(3);
      expect(storage.read()).toBe(4);
    });
  },
);

describe(
  'createQueueStorage maxLength property test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>(5);
      expect(storage.maxLength).toBe(5);
    });
  },
);

describe(
  'createQueueStorage without maxLength property test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      expect(storage.maxLength).toBeUndefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createStackStorage
// ═══════════════════════════════════════════════════════════════

describe.each([
  [[1, 2, 3], 3],
  [[42], 42],
  [['a', 'b', 'c'], 'c'],
] as Array<[unknown[], unknown]>)(
  'createStackStorage LIFO order test',
  (input, expected) => {
    it('', () => {
      const storage = createStackStorage<unknown>();
      input.forEach((item) => storage.write(item));
      expect(storage.read()).toEqual(expected);
    });
  },
);

describe(
  'createStackStorage read from empty returns undefined test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createStackStorage size test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      expect(storage.size).toBe(0);

      storage.write(1);
      storage.write(2);
      expect(storage.size).toBe(2);

      storage.read();
      expect(storage.size).toBe(1);
    });
  },
);

describe(
  'createStackStorage drains all elements test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);

      expect(storage.read()).toBe(3);
      expect(storage.read()).toBe(2);
      expect(storage.read()).toBe(1);
      expect(storage.read()).toBeUndefined();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createStackStorage clear test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.clear();
      expect(storage.size).toBe(0);
      expect(storage.read()).toBeUndefined();
    });
  },
);

describe(
  'createStackStorage reset test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.reset();
      expect(storage.size).toBe(0);
    });
  },
);

describe(
  'createStackStorage with maxLength evicts oldest test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>(2);
      storage.write(1);
      storage.write(2);
      storage.write(3); // evicts 1 (from the bottom of the stack)

      expect(storage.size).toBe(2);
      expect(storage.read()).toBe(3);
      expect(storage.read()).toBe(2);
      expect(storage.read()).toBeUndefined();
    });
  },
);

describe(
  'createStackStorage maxLength property test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>(10);
      expect(storage.maxLength).toBe(10);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Tests with direct storage creation (not via factories)
// ═══════════════════════════════════════════════════════════════

describe(
  'createLatestStorage mixed with direct LatestStorage test',
  () => {
    it('', () => {
      const direct = new LatestStorage<number>(0);
      const factory = createLatestStorage<number>(100);

      direct.write(42);
      factory.write(99);

      expect(direct.read()).toBe(42);
      expect(factory.read()).toBe(99);
    });
  },
);

describe(
  'createQueueStorage mixed with direct QueueStorage test',
  () => {
    it('', () => {
      const direct = new QueueStorage<number>(3);
      const factory = createQueueStorage<number>(3);

      direct.write(1);
      direct.write(2);
      factory.write(10);
      factory.write(20);

      expect(direct.read()).toBe(1);
      expect(factory.read()).toBe(10);
    });
  },
);

describe(
  'createStackStorage mixed with direct StackStorage test',
  () => {
    it('', () => {
      const direct = new StackStorage<string>();
      const factory = createStackStorage<string>();

      direct.write('a');
      direct.write('b');
      factory.write('x');
      factory.write('y');

      expect(direct.read()).toBe('b');
      expect(factory.read()).toBe('y');
    });
  },
);

describe(
  'direct LatestStorage with factory QueueStorage test',
  () => {
    it('', () => {
      const latest = new LatestStorage<number>();
      const queue = createQueueStorage<number>();

      latest.write(1);
      queue.write(10);
      queue.write(20);

      expect(latest.read()).toBe(1);
      expect(queue.read()).toBe(10);
      expect(queue.read()).toBe(20);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Integration tests: storages + transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'createLatestStorage integration with WriteTransfer and ReadTransfer test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>(0);
      const writer = createWriteTransfer<number>({ flow: storage });
      const reader = createReadTransfer<number>({ flow: storage });

      writer.push(42);
      expect(reader.pull()).toBe(42);

      writer.push(100);
      expect(reader.pull()).toBe(100);
    });
  },
);

describe(
  'createQueueStorage integration with WriteTransfer and ReadTransfer test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      const writer = createWriteTransfer<number>({ flow: storage });
      const reader = createReadTransfer<number>({ flow: storage });

      writer.push(1);
      writer.push(2);
      writer.push(3);

      expect(reader.pull()).toBe(1);
      expect(reader.pull()).toBe(2);
      expect(reader.pull()).toBe(3);
      expect(reader.pull()).toBeUndefined();
    });
  },
);

describe(
  'createStackStorage integration with WriteTransfer and ReadTransfer test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      const writer = createWriteTransfer<number>({ flow: storage });
      const reader = createReadTransfer<number>({ flow: storage });

      writer.push(1);
      writer.push(2);
      writer.push(3);

      expect(reader.pull()).toBe(3);
      expect(reader.pull()).toBe(2);
      expect(reader.pull()).toBe(1);
    });
  },
);

describe(
  'createLatestStorage integration with PollingFlowTransfer test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>(0);
      const writer = createWriteTransfer<number>({flow: storage});

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 50,
        activated: true,
      });

      const received: (number | undefined)[] = [];
      polling.subscribe((v) => received.push(v));

      writer.push(42);

      // Waiting for polling
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          polling.destroy();
          expect(received.length).toBeGreaterThan(0);
          expect(received[0]).toBe(42);
          resolve();
        }, 150);
      });
    });
  },
);

describe(
  'createQueueStorage integration with PollingFlowTransfer test',
  () => {
    it('', () => {
      const storage = createQueueStorage<number>();
      const writer = createWriteTransfer<number>({flow: storage});

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 50,
        activated: true,
      });

      const received: (number | undefined)[] = [];
      polling.subscribe((v) => received.push(v));

      writer.push(10);
      writer.push(20);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          polling.destroy();
          expect(received.length).toBeGreaterThanOrEqual(2);
          expect(received[0]).toBe(10);
          expect(received[1]).toBe(20);
          resolve();
        }, 200);
      });
    });
  },
);

describe(
  'createStackStorage integration with PollingFlowTransfer test',
  () => {
    it('', () => {
      const storage = createStackStorage<number>();
      const writer = createWriteTransfer<number>({flow: storage});

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 50,
        activated: true,
      });

      const received: (number | undefined)[] = [];
      polling.subscribe((v) => received.push(v));

      writer.push(1);
      writer.push(2);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          polling.destroy();
          // StackStorage: LIFO → first 2, then 1
          expect(received.length).toBeGreaterThanOrEqual(2);
          expect(received[0]).toBe(2);
          expect(received[1]).toBe(1);
          resolve();
        }, 200);
      });
    });
  },
);

describe(
  'Full pipeline: storage → polling → sink test',
  () => {
    it('', () => {
      const storage = createLatestStorage<number>(0);
      const writer = createWriteTransfer<number>({flow: storage});

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 50,
        activated: false,
      });

      const received: (number | undefined)[] = [];
      const sink = createSinkTransfer<number | undefined>({
        callback: (v) => received.push(v),
      });

      // Linking polling → sink via subscribe
      polling.subscribe((v) => sink.push(v));

      writer.push(42);
      polling.activate();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          polling.destroy();
          expect(received.length).toBeGreaterThan(0);
          expect(received[0]).toBe(42);
          resolve();
        }, 150);
      });
    });
  },
);

describe(
  'Direct QueueStorage with factory WriteTransfer and ReadTransfer test',
  () => {
    it('', () => {
      const storage = new QueueStorage<number>(5);
      const writer = createWriteTransfer<number>({flow: storage});
      const reader = createReadTransfer<number>({flow: storage});

      writer.push(10);
      writer.push(20);
      writer.push(30);

      expect(reader.pull()).toBe(10);
      expect(reader.pull()).toBe(20);
      expect(reader.pull()).toBe(30);
    });
  },
);

describe(
  'Direct StackStorage with factory WriteTransfer and ReadTransfer test',
  () => {
    it('', () => {
      const storage = new StackStorage<string>(3);
      const writer = createWriteTransfer<string>({flow: storage});
      const reader = createReadTransfer<string>({flow: storage});

      writer.push('a');
      writer.push('b');
      writer.push('c');
      writer.push('d'); // evicts 'a'

      expect(reader.pull()).toBe('d');
      expect(reader.pull()).toBe('c');
      expect(reader.pull()).toBe('b');
      expect(reader.pull()).toBeUndefined();
    });
  },
);
