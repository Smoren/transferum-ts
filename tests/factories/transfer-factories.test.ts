import type { DataFetcher, TickerFactory } from '../../src';
import {
  createPushChannelTransfer,
  createDelayedPushChannelTransfer,
  createDebounceTransfer,
  createThrottleTransfer,
  createPushStoredChannelTransfer,
  createBufferTransfer,
  createManualBufferTransfer,
  createManualFlowTransfer,
  createGateTransfer,
  createMergeTransfer,
  createSplitTransfer,
  createPollingSourceTransfer,
  createPollingProxyTransfer,
  createPollingFlowTransfer,
  createIdlePollingTransfer,
  IntervalTicker,
  LatestStorage,
  MapOperator,
  createChannelTransfer,
  createStoredChannelTransfer,
  createSinkTransfer,
  createWriteTransfer,
  createReadTransfer,
  createConvertTransfer,
  createConditionTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createPushChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createPushChannelTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createPushChannelTransfer<number>();

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForPushChannelFactory(),
] as Array<[number]>)(
  'createPushChannelTransfer push and subscribe test',
  (value: number) => {
    it('', () => {
      const transfer = createPushChannelTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

function dataProviderForPushChannelFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createDelayedPushChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createDelayedPushChannelTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createDelayedPushChannelTransfer<number>({ delay: 100 });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForDelayedPushChannelFactory(),
] as Array<[number, number]>)(
  'createDelayedPushChannelTransfer push and subscribe after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createDelayedPushChannelTransfer<number>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(delay);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

function dataProviderForDelayedPushChannelFactory(): Array<unknown> {
  return [
    [1, 50],
    [42, 100],
    [-5, 10],
  ];
}

describe(
  'createDelayedPushChannelTransfer destroy cancels pending timer test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createDelayedPushChannelTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);
      transfer.destroy();

      jest.advanceTimersByTime(100);
      expect(handler).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createDebounceTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createDebounceTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createDebounceTransfer<number>({ delay: 100 });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForDebounceFactory(),
] as Array<[number, number]>)(
  'createDebounceTransfer push and subscribe after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createDebounceTransfer<number>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(delay);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

function dataProviderForDebounceFactory(): Array<unknown> {
  return [
    [1, 50],
    [42, 100],
    [-5, 10],
  ];
}

describe(
  'createDebounceTransfer resets timer on new push test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createDebounceTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      jest.advanceTimersByTime(50);
      transfer.push(2);
      jest.advanceTimersByTime(50);

      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createDebounceTransfer destroy cancels pending timer test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createDebounceTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);
      transfer.destroy();

      jest.advanceTimersByTime(100);
      expect(handler).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createThrottleTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createThrottleTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createThrottleTransfer<number>({ interval: 100 });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForThrottleFactory(),
] as Array<[number, number]>)(
  'createThrottleTransfer leading edge emits immediately test',
  (value: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

function dataProviderForThrottleFactory(): Array<unknown> {
  return [
    [1, 50],
    [42, 100],
    [-5, 10],
  ];
}

describe(
  'createThrottleTransfer trailing edge emits pending after interval test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createThrottleTransfer<number>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.push(2);
      expect(handler).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(2, 2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createThrottleTransfer destroy cancels pending timer test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = createThrottleTransfer<number>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      transfer.push(2);
      transfer.destroy();

      jest.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createPushStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createPushStoredChannelTransfer with initialValue test',
  () => {
    it('', () => {
      const transfer = createPushStoredChannelTransfer<number>({ initialValue: 100 });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.pull()).toBe(100);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForPushStoredChannelFactory(),
] as Array<[number, number]>)(
  'createPushStoredChannelTransfer push and pull test',
  (initial: number, pushed: number) => {
    it('', () => {
      const transfer = createPushStoredChannelTransfer<number>({ initialValue: initial });

      transfer.push(pushed);

      expect(transfer.pull()).toBe(pushed);

      transfer.destroy();
    });
  },
);

function dataProviderForPushStoredChannelFactory(): Array<unknown> {
  return [
    [0, 42],
    [10, 100],
    [-5, -1],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createBufferTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createBufferTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createBufferTransfer<number>();

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForBufferFactory(),
] as Array<[number, number]>)(
  'createBufferTransfer push and pull test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = createBufferTransfer<number>();

      transfer.push(value1);
      expect(transfer.pull()).toBe(value1);

      transfer.push(value2);
      expect(transfer.pull()).toBe(value2);

      // After pull(), the buffer is empty
      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

function dataProviderForBufferFactory(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
    [-5, 5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createManualBufferTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createManualBufferTransfer requires trigger test',
  () => {
    it('', () => {
      const transfer = createManualBufferTransfer<number>();

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);

      transfer.push(42);
      // Without trigger(), pull() returns undefined
      expect(transfer.pull()).toBeUndefined();

      transfer.trigger();
      expect(transfer.pull()).toBe(42);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForManualBufferFactory(),
] as Array<[number]>)(
  'createManualBufferTransfer trigger then pull test',
  (value: number) => {
    it('', () => {
      const transfer = createManualBufferTransfer<number>();

      transfer.push(value);
      transfer.trigger();

      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

function dataProviderForManualBufferFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [100],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createManualFlowTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createManualFlowTransfer with initialValue test',
  () => {
    it('', () => {
      const transfer = createManualFlowTransfer<number>({ initialValue: 50 });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForManualFlowFactory(),
] as Array<[number]>)(
  'createManualFlowTransfer push and trigger test',
  (value: number) => {
    it('', () => {
      const transfer = createManualFlowTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      // After push(), subscribers are not notified
      expect(handler).not.toHaveBeenCalled();

      transfer.trigger();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

function dataProviderForManualFlowFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [100],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createGateTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createGateTransfer activated false test',
  () => {
    it('', () => {
      const transfer = createGateTransfer<number>({ activated: false });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isGate).toBe(true);
      expect(transfer.active).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForGateFactory(),
] as Array<[number, number]>)(
  'createGateTransfer blocks data when inactive test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = createGateTransfer<number>({ activated: false });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value1);
      expect(handler).not.toHaveBeenCalled();

      transfer.activate();
      transfer.push(value2);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value2);

      transfer.destroy();
    });
  },
);

function dataProviderForGateFactory(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createMergeTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createMergeTransfer merges multiple sources test',
  () => {
    it('', () => {
      const source1 = createPushStoredChannelTransfer<number>();
      const source2 = createPushStoredChannelTransfer<number>();

      const merge = createMergeTransfer<number>({ sources: [source1, source2] });

      expect(merge).toBeDefined();
      expect(merge.isSubscribable).toBe(true);

      const received: number[] = [];
      merge.subscribe((data) => { received.push(data); });

      source1.push(1);
      source2.push(2);
      source1.push(3);

      expect(received).toEqual([1, 2, 3]);

      merge.destroy();
      source1.destroy();
      source2.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createSplitTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createSplitTransfer splits to multiple targets test',
  () => {
    it('', () => {
      const target1 = createPushStoredChannelTransfer<number>();
      const target2 = createPushStoredChannelTransfer<number>();

      const split = createSplitTransfer<number>({ targets: [target1, target2] });

      expect(split).toBeDefined();
      expect(split.isPushable).toBe(true);

      const received1: number[] = [];
      const received2: number[] = [];
      target1.subscribe((data) => { received1.push(data); });
      target2.subscribe((data) => { received2.push(data); });

      split.push(42);

      expect(received1).toEqual([42]);
      expect(received2).toEqual([42]);

      split.destroy();
      target1.destroy();
      target2.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createPollingSourceTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createPollingSourceTransfer polling test',
  () => {
    it('', (done) => {
      let callCount = 0;
      const fetcher = jest.fn(() => {
        callCount++;
        return callCount * 10;
      });

      const polling = createPollingSourceTransfer<number>({
        fetcher,
        interval: 10,
        activated: true,
      });

      expect(polling).toBeDefined();
      expect(polling.isPollingSource).toBe(true);
      expect(polling.isPullable).toBe(true);
      expect(polling.isSubscribable).toBe(true);
      expect(polling.isGate).toBe(true);

      const received: number[] = [];
      polling.subscribe((data) => { received.push(data); });

      // Wait for several polling intervals
      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();
        expect(received.length).toBeGreaterThan(0);
        expect(callCount).toBeGreaterThan(0);

        polling.deactivate();
        polling.destroy();
        done();
      }, 50);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createPollingProxyTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createPollingProxyTransfer requires fetcher test',
  () => {
    it('', () => {
      const polling = createPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      expect(polling).toBeDefined();
      expect(polling.isPollingProxy).toBe(true);
      expect(polling.isPullable).toBe(true);
      expect(polling.isSubscribable).toBe(true);
      expect(polling.isGate).toBe(true);

      // Without a set fetcher, pull() returns undefined when inactive
      expect(polling.pull()).toBeUndefined();

      // Activate and check for error
      polling.activate();
      expect(() => polling.pull()).toThrow('Fetcher is not defined');

      polling.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createPollingFlowTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createPollingFlowTransfer polling from flow test',
  () => {
    it('', (done) => {
      const storage = new LatestStorage<number>(0);
      let counter = 0;

      // Simulate data change in storage
      const intervalId = setInterval(() => {
        counter++;
        storage.write(counter);
      }, 5);

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 10,
        activated: true,
      });

      const received: number[] = [];
      polling.subscribe((data) => { received.push(data); });

      setTimeout(() => {
        clearInterval(intervalId);
        expect(received.length).toBeGreaterThan(0);

        polling.destroy();
        done();
      }, 50);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createIdlePollingTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createIdlePollingTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createIdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: false,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createIdlePollingTransfer push and subscribe test',
  () => {
    it('', () => {
      const transfer = createIdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'createIdlePollingTransfer idle polling starts after timeout test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 99);
      const transfer = createIdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(99);

        transfer.destroy();
        done();
      }, 80);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createChannelTransfer calls setup on construct test',
  () => {
    it('', () => {
      const setupSpy = jest.fn();
      const destroySpy = jest.fn();

      const channel = createChannelTransfer<number>({
        setup: setupSpy,
        destroy: destroySpy,
      });

      expect(channel).toBeDefined();
      expect(channel.isSubscribable).toBe(true);
      expect(setupSpy).toHaveBeenCalledTimes(1);

      channel.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createStoredChannelTransfer stores last value test',
  () => {
    it('', () => {
      let emitFn: ((data: number) => void) | undefined;

      const channel = createStoredChannelTransfer<number>({
        setup: (emit) => {
          emitFn = emit;
        },
        destroy: () => {},
        initialValue: 0,
      });

      expect(channel).toBeDefined();
      expect(channel.isPullable).toBe(true);
      expect(channel.isSubscribable).toBe(true);
      expect(channel.isTriggerable).toBe(true);

      if (emitFn) {
        emitFn(100);
      }

      expect(channel.pull()).toBe(100);

      channel.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createSinkTransfer
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSinkFactory(),
] as Array<[number]>)(
  'createSinkTransfer calls callback on push test',
  (value: number) => {
    it('', () => {
      const callback = jest.fn();

      const sink = createSinkTransfer<number>({ callback });

      expect(sink).toBeDefined();
      expect(sink.isPushable).toBe(true);

      sink.push(value);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(value);

      sink.destroy();
    });
  },
);

function dataProviderForSinkFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [100],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createWriteTransfer
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForWriteFactory(),
] as Array<[number]>)(
  'createWriteTransfer writes to flow test',
  (value: number) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const writeSpy = jest.spyOn(storage, 'write');

      const writer = createWriteTransfer<number>({ flow: storage });

      expect(writer).toBeDefined();
      expect(writer.isPushable).toBe(true);

      writer.push(value);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(value);

      writer.destroy();
      writeSpy.mockRestore();
    });
  },
);

function dataProviderForWriteFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [100],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createReadTransfer
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForReadFactory(),
] as Array<[number | undefined]>)(
  'createReadTransfer reads from flow test',
  (value: number | undefined) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      if (value !== undefined) {
        storage.write(value);
      }
      const readSpy = jest.spyOn(storage, 'read');

      const reader = createReadTransfer<number>({ flow: storage });

      expect(reader).toBeDefined();
      expect(reader.isPullable).toBe(true);

      const result = reader.pull();

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(value);

      reader.destroy();
      readSpy.mockRestore();
    });
  },
);

function dataProviderForReadFactory(): Array<unknown> {
  return [
    [1],
    [42],
    [undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createConvertTransfer
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForConvertFactory(),
] as Array<[number, string]>)(
  'createConvertTransfer transforms data test',
  (input: number, expected: string) => {
    it('', () => {
      const operator = new MapOperator<number, string>((n) => `val_${n}`);

      const converter = createConvertTransfer<number, string>({ operator });

      expect(converter).toBeDefined();
      expect(converter.isPushable).toBe(true);
      expect(converter.isSubscribable).toBe(true);

      const handler = jest.fn();
      converter.subscribe(handler);

      converter.push(input);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expected);

      converter.destroy();
    });
  },
);

function dataProviderForConvertFactory(): Array<unknown> {
  return [
    [1, 'val_1'],
    [42, 'val_42'],
    [100, 'val_100'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// createConditionTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createConditionTransfer filters on accept test',
  () => {
    it('', () => {
      const condition = createConditionTransfer<number>({
        shouldAccept: (n) => n > 0,
      });

      expect(condition).toBeDefined();
      expect(condition.isPushable).toBe(true);
      expect(condition.isSubscribable).toBe(true);

      const handler = jest.fn();
      condition.subscribe(handler);

      condition.push(-5);  // Will not pass filter
      condition.push(0);   // Will not pass filter
      condition.push(5);   // Will pass filter

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(5);

      condition.destroy();
    });
  },
);

describe(
  'createConditionTransfer filters on emit test',
  () => {
    it('', () => {
      const condition = createConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: (n) => n !== undefined && n < 100,
      });

      const handler = jest.fn();
      condition.subscribe(handler);

      condition.push(50);   // Passes (50 < 100)
      condition.push(150);  // Does not pass (150 >= 100)
      condition.push(75);   // Passes (75 < 100)

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, 50);
      expect(handler).toHaveBeenNthCalledWith(2, 75);

      condition.destroy();
    });
  },
);

describe(
  'createConditionTransfer both filters test',
  () => {
    it('', () => {
      const condition = createConditionTransfer<number>({
        shouldAccept: (n) => n > 0,
        shouldEmit: (n) => n !== undefined && n < 100,
      });

      const handler = jest.fn();
      condition.subscribe(handler);

      condition.push(-5);   // Does not pass shouldAccept
      condition.push(50);   // Passes both filters
      condition.push(150);  // Passes shouldAccept, but not shouldEmit
      condition.push(75);   // Passes both filters

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, 50);
      expect(handler).toHaveBeenNthCalledWith(2, 75);

      condition.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Factories — Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'createPushChannelTransfer handles null value test',
  () => {
    it('', () => {
      const transfer = createPushChannelTransfer<null>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(null);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(null);

      transfer.destroy();
    });
  },
);

describe(
  'createBufferTransfer handles object value test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const transfer = createBufferTransfer<Obj>();
      const obj: Obj = { id: 1, name: 'test' };

      transfer.push(obj);
      const result = transfer.pull();

      expect(result).toBe(obj);

      transfer.destroy();
    });
  },
);

describe(
  'createGateTransfer toggle test',
  () => {
    it('', () => {
      const transfer = createGateTransfer<number>({ activated: true });

      expect(transfer.active).toBe(true);

      expect(transfer.toggle()).toBe(false);
      expect(transfer.active).toBe(false);

      expect(transfer.toggle()).toBe(true);
      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createMergeTransfer empty sources test',
  () => {
    it('', () => {
      const merge = createMergeTransfer<number>({ sources: [] });

      expect(merge).toBeDefined();
      expect(merge.isSubscribable).toBe(true);

      const handler = jest.fn();
      merge.subscribe(handler);

      // No sources — subscription will not fire
      expect(handler).not.toHaveBeenCalled();

      merge.destroy();
    });
  },
);

describe(
  'createSplitTransfer empty targets test',
  () => {
    it('', () => {
      const split = createSplitTransfer<number>({ targets: [] });

      expect(split).toBeDefined();
      expect(split.isPushable).toBe(true);

      // push() should not throw an error
      expect(() => split.push(42)).not.toThrow();

      split.destroy();
    });
  },
);

describe(
  'createConvertTransfer undefined result test',
  () => {
    it('', () => {
      const operator = new MapOperator<number, number | undefined>((n) => {
        return n > 0 ? n : undefined;
      });

      const converter = createConvertTransfer<number, number>({ operator });

      const handler = jest.fn();
      converter.subscribe(handler);

      converter.push(5);    // Passes
      converter.push(-5);   // Returns undefined — subscribers are not notified

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(5);

      converter.destroy();
    });
  },
);

describe(
  'createSinkTransfer handles multiple pushes test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const sink = createSinkTransfer<number>({ callback });

      sink.push(1);
      sink.push(2);
      sink.push(3);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 1);
      expect(callback).toHaveBeenNthCalledWith(2, 2);
      expect(callback).toHaveBeenNthCalledWith(3, 3);

      sink.destroy();
    });
  },
);

describe(
  'createChannelTransfer handles setup error test',
  () => {
    it('', () => {
      const onError = jest.fn();

      const channel = createChannelTransfer<number>({
        setup: () => {
          throw new Error('Setup error');
        },
        destroy: () => {},
        onSetupError: onError,
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Setup error' }));

      channel.destroy();
    });
  },
);

describe(
  'createPollingSourceTransfer error handling test',
  () => {
    it('', () => {
      const onError = jest.fn();
      const fetcher = jest.fn(() => {
        throw new Error('Fetch error');
      });

      const polling = createPollingSourceTransfer<number>({
        fetcher,
        interval: 10,
        activated: true,
        onError,
      });

      // Wait for several intervals
      setTimeout(() => {
        expect(onError).toHaveBeenCalled();

        polling.destroy();
      }, 50);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Factory functions — Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'createPollingSourceTransfer accepts tickerFactory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const polling = createPollingSourceTransfer<number>({
        fetcher: () => 42,
        interval: 100,
        activated: true,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createPollingSourceTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();

      const polling = createPollingSourceTransfer<number>({
        fetcher: () => 42,
        interval: 100,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      polling.subscribe((data) => {
        if (data !== undefined) callback();
      });

      // Leading edge
      jest.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createPollingProxyTransfer accepts tickerFactory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const polling = createPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      jest.advanceTimersByTime(0);
      expect(tickerFactory).toHaveBeenCalledTimes(0);

      const fetcher = jest.fn() as DataFetcher<number>;
      polling.setFetcher(fetcher);

      jest.advanceTimersByTime(0);
      expect(tickerFactory).toHaveBeenCalledTimes(1);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createPollingProxyTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();

      const polling = createPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      polling.setFetcher(() => 42);
      polling.subscribe((data) => {
        if (data !== undefined) callback();
      });

      jest.advanceTimersByTime(0);

      // Leading edge
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createPollingFlowTransfer accepts tickerFactory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const storage = new LatestStorage<number>();
      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: true,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createPollingFlowTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const storage = new LatestStorage<number>();
      storage.write(42);

      const polling = createPollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      polling.subscribe((data) => {
        if (data !== undefined) callback();
      });

      jest.advanceTimersByTime(0);

      // Leading edge
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      polling.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createIdlePollingTransfer accepts tickerFactory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: false,
        interval: 50,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = createIdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: false,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(0);
      expect(customTicker.start).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'createIdlePollingTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();

      const transfer = createIdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      transfer.subscribe((data) => {
        if (data !== undefined) callback();
      });

      // Leading edge on trigger
      transfer.trigger();
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time to trigger the idle timer (timeout).
      // After it, IntervalTicker.start() registers a leading-edge
      // call via setTimeout(fn, 0). This timer is created at the moment
      // the idle timer fires — at the advanceTimersByTime boundary —
      // and is NOT executed in the same tick (Jest fake timers limitation:
      // timers registered during advancement are not
      // automatically processed). Therefore we explicitly process
      // pending timers, otherwise leading edge fails and the counter
      // is off. Previously there was a workaround advanceTimersByTime(1).
      jest.advanceTimersByTime(100); // timeout → start polling
      jest.runOnlyPendingTimers();   // processes the leading-edge setTimeout(0)

      expect(callback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(50); // interval
      expect(callback).toHaveBeenCalledTimes(3);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

