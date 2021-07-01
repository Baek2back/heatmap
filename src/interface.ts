export type AxisFields = "x" | "y";
export type ValueFields = AxisFields | "value";

export type fEmptyVoid = () => void;
export type fEmptyReturn = () => any;
export type fArgsVoid = (...args: any[]) => void;
export type fArgsReturn = (...args: any[]) => any;

export interface Point {
  x: number;
  y: number;
}

export interface DataPoint extends Point {
  value: number;
  radius: number;
}
