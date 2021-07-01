import { AxisFields, ValueFields, DataPoint } from "./interface";
import defaultConfigs from "./defaultConfig";
import Coordinator from "./coordinator";

interface StoreConfig {
  xField: AxisFields;
  yField: AxisFields;
  valueField: ValueFields;
  radius: number;
}

interface StoreData {
  min: number;
  max: number;
  data: DataPoint[];
}

interface StoreSourceData {
  min: number;
  max: number;
  data: number[][];
  radi: number[][];
}

class Store {
  coordinator: Coordinator;
  data: number[][];
  radi: number[][];
  min: number;
  max: number;
  xField: AxisFields;
  yField: AxisFields;
  valueField: ValueFields;
  radius: number;

  constructor(config: Partial<StoreConfig>) {
    this.coordinator = new Coordinator();
    this.data = [];
    this.radi = [];
    this.min = 10;
    this.max = 1;
    this.xField = config.xField || defaultConfigs.defaultXField;
    this.yField = config.yField || defaultConfigs.defaultYField;
    this.valueField = config.valueField || defaultConfigs.defaultValueField;
    this.radius = config.radius || defaultConfigs.defaultRadius;
  }

  private organizeData(dataPoint: DataPoint, forceRender: boolean) {
    const [x, y] = [dataPoint[this.xField], dataPoint[this.yField]];
    const radi = this.radi;
    const data = this.data;
    const max = this.max;
    const min = this.min;
    const value = dataPoint[this.valueField] || 1;
    const radius = dataPoint.radius || this.radius;
    if (!radi[x]) {
      data[x] = [];
      radi[x] = [];
    }
    if (!radi[x][y]) {
      data[x][y] = value;
      radi[x][y] = radius;
    } else {
      data[x][y] += value;
    }

    const storedVal = data[x][y];
    if (storedVal) {
      if (storedVal > max) {
        if (!forceRender) {
          this.max = storedVal;
        } else {
          this.setDataMax(storedVal);
        }
      } else if (storedVal < min) {
        if (!forceRender) {
          this.min = storedVal;
        } else {
          this.setDataMin(storedVal);
        }
        return false;
      }
    }
    return {
      x,
      y,
      value,
      radius,
      min,
      max,
    };
  }

  private unorganizedData(): StoreData {
    const unorganizedData: DataPoint[] = [];
    for (let x = 0; x < this.radi.length; x++) {
      for (let y = 0; y < this.radi[x].length; y++) {
        unorganizedData.push({
          x,
          y,
          radius: this.radi[x][y],
          value: this.radi[x][y],
        });
      }
    }
    return {
      min: this.min,
      max: this.max,
      data: unorganizedData,
    };
  }

  private onExtremaChange(): void {
    this.coordinator.emit("extremachange", {
      min: this.min,
      max: this.max,
    });
  }

  addData(data: DataPoint): void {
    const organizedEntry = this.organizeData(data, true);

    if (!organizedEntry) return;

    if (this.data.length === 0) {
      [this.min, this.max] = [organizedEntry.value, organizedEntry.value];
    }

    this.coordinator.emit("renderpartial", {
      min: this.min,
      max: this.max,
      data: [organizedEntry],
    });
  }

  setData(resData: StoreData): Store {
    const dataPoints = resData.data;

    this.data = [];
    this.radi = [];

    dataPoints.forEach((points) => {
      this.organizeData(points, false);
    });

    this.max = resData.max;
    this.min = resData.min || 0;

    this.onExtremaChange();
    this.coordinator.emit("renderall", this.getInternalData());

    return this;
  }

  setDataMax(max: number): Store {
    this.max = max;

    this.onExtremaChange();
    this.coordinator.emit("renderall", this.getInternalData());

    return this;
  }

  setDataMin(min: number): Store {
    this.min = min;

    this.onExtremaChange();
    this.coordinator.emit("renderall", this.getInternalData());

    return this;
  }

  getData(): StoreData {
    return this.unorganizedData();
  }

  getInternalData(): StoreSourceData {
    return {
      max: this.max,
      min: this.min,
      data: this.data,
      radi: this.radi,
    };
  }
}

export { StoreConfig, StoreData, StoreSourceData };

export default Store;
