import { crayon } from "./deps.ts";
import { Rectangle } from "./types.ts";

export enum Timing {
  Pre = "pre",
  Post = "post",
}

export const textEncoder = new TextEncoder();

export const UNICODE_CHAR_REGEXP =
  /\ud83c[\udffb-\udfff](?=\ud83c[\udffb-\udfff])|(?:(?:\ud83c\udff4\udb40\udc67\udb40\udc62\udb40(?:\udc65|\udc73|\udc77)\udb40(?:\udc6e|\udc63|\udc6c)\udb40(?:\udc67|\udc74|\udc73)\udb40\udc7f)|[^\ud800-\udfff][\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]?|[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff\u1ab0-\u1aff\u1dc0-\u1dff]|\ud83c[\udffb-\udfff])?)*/g;

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function clamp(number: number, min: number, max: number): number {
  return Math.max(Math.min(number, max), min);
}

export function fits(number: number, min: number, max: number): boolean {
  return number === clamp(number, min, max);
}

export function fitsInRectangle(column: number, row: number, rectangle?: Rectangle): boolean {
  if (!rectangle) return true;
  return fits(column, rectangle.column, rectangle.column + rectangle.width) &&
    fits(row, rectangle.row, rectangle.row + rectangle.height);
}

export function insertAt(string: string, index: number, value: string): string {
  return string.slice(0, index) + value + string.slice(index);
}

export function normalize(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) || 0;
}

export function textWidth(text: string): number {
  if (!text) return 0;

  let width = 0;
  for (const letter of crayon.strip(text)) {
    width += isFullWidth(letter) ? 2 : 1;
  }

  return width;
}

export function isFullWidth(character: string): boolean {
  const codePoint = character.charCodeAt(0);

  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (0x2e80 <= codePoint && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (0x3250 <= codePoint && codePoint <= 0x4dbf) ||
      (0x4e00 <= codePoint && codePoint <= 0xa4c6) ||
      (0xa960 <= codePoint && codePoint <= 0xa97c) ||
      (0xac00 <= codePoint && codePoint <= 0xd7a3) ||
      (0xf900 <= codePoint && codePoint <= 0xfaff) ||
      (0xfe10 <= codePoint && codePoint <= 0xfe19) ||
      (0xfe30 <= codePoint && codePoint <= 0xfe6b) ||
      (0xff01 <= codePoint && codePoint <= 0xff60) ||
      (0xffe0 <= codePoint && codePoint <= 0xffe6) ||
      (0x1b000 <= codePoint && codePoint <= 0x1b001) ||
      (0x1f200 <= codePoint && codePoint <= 0x1f251) ||
      (0x20000 <= codePoint && codePoint <= 0x3fffd))
  );
}

export type EventRecord = Record<string, Event>;

export class TypedEventTarget<EventMap extends EventRecord> {
  eventTarget: EventTarget;

  constructor() {
    this.eventTarget = new EventTarget();
  }

  addEventListener<Event extends keyof EventMap>(
    types: Event | Event[],
    listener: (this: TypedEventTarget<EventMap>, event: EventMap[Event]) => void | Promise<void>,
    options?: AddEventListenerOptions,
  ): void {
    types = Array.isArray(types) ? types : [types];
    for (const type of types) {
      this.eventTarget.addEventListener(type as string, listener as EventListener, options);
    }
  }

  removeEventListener<Event extends keyof EventMap>(
    types: Event | Event[],
    listener: (this: TypedEventTarget<EventMap>, event: EventMap[Event]) => void | Promise<void>,
    options?: AddEventListenerOptions,
  ): void {
    types = Array.isArray(types) ? types : [types];
    for (const type of types) {
      this.eventTarget.removeEventListener(type as string, listener as EventListener, options);
    }
  }

  dispatchEvent<EventType extends Event>(event: EventType): boolean {
    return this.eventTarget.dispatchEvent(event);
  }
}

export type CompareFn<T> = (a: T, b: T) => number;

export class SortedArray<T = unknown> extends Array<T> {
  compareFn?: CompareFn<T>;

  constructor(compareFn?: CompareFn<T>, ...items: T[]) {
    super(...items);
    this.compareFn = compareFn;
  }

  push(...items: T[]) {
    super.push(...items);
    this.sort(this.compareFn);
    return this.length;
  }

  remove(...items: T[]) {
    const filtered = this.filter((item) => !items.includes(item));
    this.length = 0;
    this.push(...filtered);
    return this.length;
  }
}

export class CombinedAsyncIterator<T = unknown> {
  #asyncIterators: AsyncIterable<T>[] = [];

  constructor(...iterables: AsyncIterable<T>[]) {
    this.#asyncIterators.push(...iterables);
  }

  async *iterate(): AsyncIterableIterator<T> {
    const yields: T[] = [];
    let promise!: Promise<void>;
    let resolve!: () => void;

    const defer = () => {
      promise = new Promise((r) => {
        resolve = r;
      });
    };
    defer();

    for (const iterator of this.#asyncIterators) {
      void async function () {
        for await (const value of iterator) {
          yields.push(value);
          resolve();
        }
      }();
    }

    while (true) {
      await promise;
      defer();

      for (const value of yields) {
        yield value;
      }

      yields.length = 0;
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.iterate();
  }
}
