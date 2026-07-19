import {
  DisplaceTransfer,
  AsyncConvertTransfer,
  AsyncMapOperator,
  AsyncConditionTransfer,
  BaseStateTransfer,
  SubscriptionManager,
  createDisplaceTransfer,
  createAsyncConvertTransfer,
  createAsyncMapOperator,
} from '../../src';
import type {
  AsyncPushableTransferInterface,
  SubscribableTransferInterface,
  DataHandler,
  SubscriberInterface,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Helper: StreamChannelTransfer
// ═══════════════════════════════════════════════════════════════
// A transfer that is both AsyncPushable and Subscribable.
// asyncPush(data) calls setup(data, emit), which can start streaming.
// emit(value) forwards to subscribers synchronously.

class StreamChannelTransfer<TInput, TOutput> extends BaseStateTransfer<TOutput>
  implements AsyncPushableTransferInterface<TInput>, SubscribableTransferInterface<TOutput> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isAsyncPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<TOutput>;
  private readonly _setup: (data: TInput, emit: (value: TOutput) => void) => void;
  private readonly _destroyFn: () => void;

  constructor(config: {
    setup: (data: TInput, emit: (value: TOutput) => void) => void;
    destroy: () => void;
  }) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._setup = config.setup;
    this._destroyFn = config.destroy;
  }

  async asyncPush(data: TInput): Promise<void> {
    this._setup(data, (value: TOutput) => {
      this._state.value = value;
      this._subscription.sendState();
      this._state.clear();
    });
  }

  subscribe(handler: DataHandler<TOutput>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  override destroy() {
    this._subscription.destroy();
    this._destroyFn();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer
// ═══════════════════════════════════════════════════════════════
// Displace transfer: for each input value, creates a new inner
// async-pushable + subscribable transfer via a factory function,
// subscribes to it, pushes the value via asyncPush(), and forwards
// the inner's emissions to outer subscribers.
// On each new push(), the previous inner subscription is unsubscribed
// and the previous inner transfer is destroyed.
// Capabilities: isInput, isOutput, isPushable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => new AsyncConvertTransfer<number, string>({
          operator: new AsyncMapOperator(async (n) => n.toString()),
        }),
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isAsyncPushable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(false);
      expect(transfer.isAsyncTriggerable).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Basic Push & Subscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer push creates inner and forwards emissions test',
  () => {
    it('', () => {
      let innerEmit!: (data: string) => void;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          return new StreamChannelTransfer<number, string>({
            setup: (_data, emit) => { innerEmit = emit; },
            destroy: () => {},
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      innerEmit('hello');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('hello');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer push notifies multiple subscribers test',
  () => {
    it('', () => {
      let innerEmit!: (data: string) => void;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          return new StreamChannelTransfer<number, string>({
            setup: (_data, emit) => { innerEmit = emit; },
            destroy: () => {},
          });
        },
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.push(42);

      innerEmit('world');

      expect(handler1).toHaveBeenCalledWith('world');
      expect(handler2).toHaveBeenCalledWith('world');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer undefined emission does not notify subscribers test',
  () => {
    it('', () => {
      let innerEmit!: (data: string | undefined) => void;
      const transfer = new DisplaceTransfer<number, string | undefined>({
        factory: () => {
          return new StreamChannelTransfer<number, string | undefined>({
            setup: (_data, emit) => { innerEmit = emit; },
            destroy: () => {},
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      innerEmit(undefined);

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Displace Behavior — Cancel Previous Inner
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer new push disposes previous inner subscription test',
  () => {
    it('', () => {
      const destroyed: number[] = [];
      let emit1!: (data: string) => void;
      let emit2!: (data: string) => void;

      let factoryCall = 0;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          factoryCall++;
          const callIdx = factoryCall;
          return new StreamChannelTransfer<number, string>({
            setup: (_data, emit) => {
              if (callIdx === 1) emit1 = emit;
              else emit2 = emit;
            },
            destroy: () => { destroyed.push(callIdx); },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.push(1);
      emit1('first');

      transfer.push(2);
      emit2('second');

      // After switching, emit from old inner should not reach subscribers
      emit1('stale');

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, 'first');
      expect(handler).toHaveBeenNthCalledWith(2, 'second');

      // Old inner was destroyed
      expect(destroyed).toEqual([1]);

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer rapid push only latest inner emissions pass through test',
  () => {
    it('', () => {
      const destroyed: number[] = [];
      const emits: ((data: string) => void)[] = [];

      let factoryCall = 0;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          factoryCall++;
          const callIdx = factoryCall;
          const idx = callIdx - 1;
          return new StreamChannelTransfer<number, string>({
            setup: (_data, emit) => { emits[idx] = emit; },
            destroy: () => { destroyed.push(callIdx); },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.push(1);
      transfer.push(2);
      transfer.push(3);

      // Only the latest inner (3) should be active
      emits[0]?.('from-1');
      emits[1]?.('from-2');
      emits[2]?.('from-3');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('from-3');

      // All previous inners were destroyed
      expect(destroyed).toEqual([1, 2]);

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer no previous inner on first push does not throw test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => new StreamChannelTransfer<number, string>({
          setup: () => {},
          destroy: () => {},
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      expect(() => transfer.push(42)).not.toThrow();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer destroy disposes current inner transfer test',
  () => {
    it('', () => {
      const destroyed: number[] = [];
      let factoryCall = 0;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          factoryCall++;
          const callIdx = factoryCall;
          return new StreamChannelTransfer<number, string>({
            setup: () => {},
            destroy: () => { destroyed.push(callIdx); },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      transfer.destroy();

      expect(destroyed).toEqual([1]);
    });
  },
);

describe(
  'DisplaceTransfer destroy cleans up outer subscriptions test',
  () => {
    it('', () => {
      let innerEmit!: (data: string) => void;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => new StreamChannelTransfer<number, string>({
          setup: (_data, emit) => { innerEmit = emit; },
          destroy: () => {},
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);
      transfer.destroy();

      innerEmit('after-destroy');
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'DisplaceTransfer destroy without inner does not throw test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => new StreamChannelTransfer<number, string>({
          setup: () => {},
          destroy: () => {},
        }),
      });

      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

describe(
  'DisplaceTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => new StreamChannelTransfer<number, string>({
          setup: () => {},
          destroy: () => {},
        }),
      });

      transfer.push(42);

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer factory error with onError suppresses test',
  () => {
    it('', () => {
      const error = new Error('factory error');
      const onError = jest.fn();
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => { throw error; },
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      expect(() => transfer.push(42)).not.toThrow();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer factory error without onError rethrows test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => { throw new Error('factory error'); },
      });

      expect(() => transfer.push(42)).toThrow('factory error');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer factory error keeps previous inner active test',
  () => {
    it('', () => {
      let emit1!: (data: string) => void;
      let factoryCall = 0;
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          factoryCall++;
          if (factoryCall === 1) {
            return new StreamChannelTransfer<number, string>({
              setup: (_data, emit) => { emit1 = emit; },
              destroy: () => {},
            });
          }
          throw new Error('factory error');
        },
        onError: () => {},
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      emit1('first');

      // Factory throws on second push — suppressed, previous inner remains active
      transfer.push(2);
      emit1('still-active');

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, 'first');
      expect(handler).toHaveBeenNthCalledWith(2, 'still-active');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Real-World Scenarios
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer fetch(url) → one result test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<string, string>({
        factory: () => new AsyncConvertTransfer<string, string>({
          operator: new AsyncMapOperator(async (url: string) => {
            await new Promise((r) => setTimeout(r, 10));
            return `response:${url}`;
          }),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('https://api.example.com/data');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('response:https://api.example.com/data');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer fetch cancelled by new push test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<string, string>({
        factory: () => new AsyncConvertTransfer<string, string>({
          operator: new AsyncMapOperator(async (url: string) => {
            const delay = url.includes('slow') ? 50 : 10;
            await new Promise((r) => setTimeout(r, delay));
            return `response:${url}`;
          }),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // First fetch — slow (50ms)
      transfer.push('https://api.example.com/slow');

      // Second fetch — fast (10ms), displaces the first
      await new Promise((resolve) => setTimeout(resolve, 10));
      transfer.push('https://api.example.com/fast');

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Only the fast response should arrive
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('response:https://api.example.com/fast');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer validate(input) → one result test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<string, boolean>({
        factory: () => new AsyncConvertTransfer<string, boolean>({
          operator: new AsyncMapOperator(async (input: string) => input.length > 0),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('valid');

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(true);

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer WebSocket per value → stream of values test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<string, string>({
        factory: () => {
          let cancelled = false;
          let intervalId: ReturnType<typeof setInterval> | null = null;
          let count = 0;
          return new StreamChannelTransfer<string, string>({
            setup: (topic, emit) => {
              intervalId = setInterval(() => {
                if (!cancelled) emit(`${topic}:${++count}`);
              }, 10);
            },
            destroy: () => {
              cancelled = true;
              if (intervalId !== null) clearInterval(intervalId);
            },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('topic-a');

      // Wait for some emissions
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler.mock.calls.length).toBeGreaterThanOrEqual(2);
          expect(handler.mock.calls[0][0]).toBe('topic-a:1');
          expect(handler.mock.calls[1][0]).toBe('topic-a:2');

          transfer.destroy();
          resolve();
        }, 35);
      });
    });
  },
);

describe(
  'DisplaceTransfer WebSocket cancelled by new push test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<string, string>({
        factory: () => {
          let cancelled = false;
          let intervalId: ReturnType<typeof setInterval> | null = null;
          let count = 0;
          return new StreamChannelTransfer<string, string>({
            setup: (topic, emit) => {
              intervalId = setInterval(() => {
                if (!cancelled) emit(`${topic}:${++count}`);
              }, 10);
            },
            destroy: () => {
              cancelled = true;
              if (intervalId !== null) clearInterval(intervalId);
            },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('topic-a');

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const firstCount = handler.mock.calls.length;

          // Switch to topic-b — topic-a should stop emitting
          transfer.push('topic-b');

          setTimeout(() => {
            // All new emissions should be from topic-b
            const allCalls = handler.mock.calls.map((c) => c[0] as string);
            const topicACalls = allCalls.filter((s) => s.startsWith('topic-a'));
            const topicBCalls = allCalls.filter((s) => s.startsWith('topic-b'));

            expect(topicBCalls.length).toBeGreaterThan(0);
            // No topic-a emissions after switch
            expect(topicACalls.length).toBe(firstCount);

            transfer.destroy();
            resolve();
          }, 30);
        }, 25);
      });
    });
  },
);

describe(
  'DisplaceTransfer setInterval per value → series of emits test',
  () => {
    it('', () => {
      const transfer = new DisplaceTransfer<number, number>({
        factory: () => {
          let cancelled = false;
          let intervalId: ReturnType<typeof setInterval> | null = null;
          let count = 0;
          return new StreamChannelTransfer<number, number>({
            setup: (seed, emit) => {
              count = seed;
              intervalId = setInterval(() => {
                if (!cancelled) emit(count++);
              }, 10);
            },
            destroy: () => {
              cancelled = true;
              if (intervalId !== null) clearInterval(intervalId);
            },
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(100);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(handler.mock.calls.length).toBeGreaterThanOrEqual(3);
          expect(handler.mock.calls[0][0]).toBe(100);
          expect(handler.mock.calls[1][0]).toBe(101);
          expect(handler.mock.calls[2][0]).toBe(102);

          transfer.destroy();
          resolve();
        }, 40);
      });
    });
  },
);

describe(
  'DisplaceTransfer readFile() → one result test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<string, string>({
        factory: () => new AsyncConvertTransfer<string, string>({
          operator: new AsyncMapOperator(async (path: string) => {
            await new Promise((r) => setTimeout(r, 10));
            return `contents:${path}`;
          }),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push('/etc/hosts');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('contents:/etc/hosts');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Search-as-you-type Scenario
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer search-as-you-type only latest result wins test',
  () => {
    it('', async () => {
      interface SearchResult { query: string; results: string[] }

      const transfer = new DisplaceTransfer<string, SearchResult>({
        factory: () => new AsyncConvertTransfer<string, SearchResult>({
          operator: new AsyncMapOperator(async (query: string) => {
            const delay = query.length * 10; // longer queries take longer
            await new Promise((r) => setTimeout(r, delay));
            return { query, results: [`${query}-1`, `${query}-2`] };
          }),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Simulate rapid typing
      transfer.push('h');   // delay 10ms
      transfer.push('he');  // delay 20ms
      transfer.push('hel'); // delay 30ms

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Only the latest query result should arrive
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        query: 'hel',
        results: ['hel-1', 'hel-2'],
      });

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer with Async Inner Transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'DisplaceTransfer with AsyncConvertTransfer inner forwards transformed result test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          return new AsyncConvertTransfer<number, string>({
            operator: new AsyncMapOperator(async (n) => `result:${n}`),
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('result:42');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer with AsyncConvertTransfer inner cancelled by new push test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          return new AsyncConvertTransfer<number, string>({
            operator: new AsyncMapOperator(async (n) => {
              await new Promise((r) => setTimeout(r, 50));
              return `result:${n}`;
            }),
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.push(1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      transfer.push(2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('result:2');

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer with AsyncConvertTransfer inner error suppresses test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<number, string>({
        factory: () => {
          return new AsyncConvertTransfer<number, string>({
            operator: new AsyncMapOperator(async () => { throw new Error('inner error'); }),
            onError: () => {},
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer with AsyncConditionTransfer inner passes accepted value test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<number, number>({
        factory: () => {
          return new AsyncConditionTransfer<number>({
            shouldAccept: async (n) => n > 0,
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'DisplaceTransfer with AsyncConditionTransfer inner blocks rejected value test',
  () => {
    it('', async () => {
      const transfer = new DisplaceTransfer<number, number>({
        factory: () => {
          return new AsyncConditionTransfer<number>({
            shouldAccept: async (n) => n > 0,
          });
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(-1);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DisplaceTransfer Factory Function
// ═══════════════════════════════════════════════════════════════

describe(
  'createDisplaceTransfer factory creates working transfer test',
  () => {
    it('', () => {
      let innerEmit!: (data: string) => void;
      const transfer = createDisplaceTransfer<number, string>({
        factory: () => new StreamChannelTransfer<number, string>({
          setup: (_data, emit) => { innerEmit = emit; },
          destroy: () => {},
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      innerEmit('factory-works');

      expect(handler).toHaveBeenCalledWith('factory-works');

      transfer.destroy();
    });
  },
);

describe(
  'createDisplaceTransfer factory with AsyncConvertTransfer inner test',
  () => {
    it('', async () => {
      const transfer = createDisplaceTransfer<number, string>({
        factory: () => createAsyncConvertTransfer<number, string>({
          operator: createAsyncMapOperator(async (n: number) => `result:${n * 2}`),
        }),
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(21);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(handler).toHaveBeenCalledWith('result:42');

      transfer.destroy();
    });
  },
);
