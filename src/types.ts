// Copyright 2021 Im-Beast. All rights reserved. MIT license.
// In this module should be served types that aren't specific to only one function or module

import { CanvasStyler } from "./canvas.ts";
import { TuiInstance } from "./tui.ts";
import { ExtendedTuiComponent } from "./tui_component.ts";

type _Range<
  From extends number,
  To extends number,
  R extends unknown[],
> = R["length"] extends To ? To
  : 
    | (R["length"] extends Range<0, From> ? From : R["length"])
    | _Range<From, To, [To, ...R]>;
// Returns type for numbers between given range
export type Range<From extends number, To extends number> = number extends From
  ? number
  : _Range<From, To, []>;

// deno-lint-ignore no-explicit-any
type _any = any;
// deno-fmt-ignore
export type AnyComponent = ExtendedTuiComponent< _any,  { [x in _any]: _any;  },  _any, _any >;

export type TuiObject = TuiInstance | AnyComponent;

export interface Writer extends Deno.Writer {
  readonly rid: number;
}

export interface Reader extends Deno.Reader {
  readonly rid: number;
}

/** Definition on how Tui or TuiComponent should look like */
export interface TuiStyler extends CanvasStyler {
  active?: CanvasStyler;
  focused?: CanvasStyler;
  frame?: CanvasStyler & {
    active?: CanvasStyler;
    focused?: CanvasStyler;
    label?: Dynamic<string>;
  };
}

/** Positioning of text */
export interface TextAlign {
  horizontal: "left" | "center" | "right";
  vertical: "top" | "center" | "bottom";
}

export interface TuiRectangle {
  column: number;
  row: number;
  width: number;
  height: number;
}

export interface ConsoleSize {
  columns: number;
  rows: number;
}

export type Dynamic<T> = T | (() => T);
