import Store, { StoreData } from "./store";
import Renderer, { RendererConfig } from "./renderer";
import defaultConfigs from "./defaultConfig";
import { Point, DataPoint, fArgsReturn } from "./interface";

interface HeatMapConfig extends RendererConfig {
  onExtremaChange: fArgsReturn;
}

class HeatMap {
  config: Partial<HeatMapConfig>;
  renderer: Renderer;
  store: Store;

  constructor(config: Partial<HeatMapConfig>) {
    this.config = config;
    this.renderer = new Renderer(this.config);
    this.store = new Store(this.config);
    this.init();
  }

  private init(): void {
    this.store.coordinator
      .on("renderpartial", this.renderer.renderPartial, this.renderer)
      .on("renderall", this.renderer.renderAll, this.renderer)
      .on("extremachange", (data: any) => {
        this.config.onExtremaChange &&
          this.config.onExtremaChange({
            min: data.min,
            max: data.max,
            gradient: this.config.gradient || defaultConfigs.defaultGradient,
          });
      });
  }

  addData(data: DataPoint): HeatMap {
    this.store.addData(data);
    return this;
  }

  setData(data: StoreData): HeatMap {
    this.store.setData(data);
    return this;
  }

  setDataMax(max: number): HeatMap {
    this.store.setDataMax(max);
    return this;
  }

  setDataMin(min: number): HeatMap {
    this.store.setDataMin(min);
    return this;
  }

  repaint(): HeatMap {
    this.store.coordinator.emit("renderall", this.store.getInternalData());
    return this;
  }

  getData(): StoreData {
    return this.store.getData();
  }

  getDataURL(): string {
    return this.renderer.getDataURL();
  }

  getValueAt(point: Point): number {
    return this.renderer.getValueAt(point);
  }
}

export default HeatMap;

(() => {
  const $hmContainer = document.createElement("div");
  document.body.appendChild($hmContainer);
  window.onload = function () {
    const $hm = new HeatMap({
      container: $hmContainer,
      maxOpacity: 0.6,
      radius: 50,
      blur: 0.9,
    });

    $hmContainer.addEventListener("mousemove", (e: MouseEvent) => {
      e.preventDefault();
      const { clientX, clientY } = e;
      $hm.addData({ x: clientX, y: clientY, value: 1, radius: 20 });
    });
  };
})();
