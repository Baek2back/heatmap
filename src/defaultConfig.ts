import { AxisFields, ValueFields } from "./interface";

export interface DefaultConfig {
  defaultRadius: number;
  defaultGradient: Record<number, string>;
  defaultMaxOpacity: number;
  defaultMinOpacity: number;
  defaultBlur: number;
  defaultXField: AxisFields;
  defaultYField: AxisFields;
  defaultValueField: ValueFields;
  plugins: Record<string, unknown>;
}

const defaultConfigs: DefaultConfig = {
  defaultRadius: 40,
  defaultGradient: {
    0.25: "rgb(0,0,255)",
    0.55: "rgb(0,255,0)",
    0.85: "yellow",
    1.0: "rgb(255,0,0)",
  },
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: 0.85,
  defaultXField: "x",
  defaultYField: "y",
  defaultValueField: "value",
  plugins: {},
};

export default defaultConfigs;
