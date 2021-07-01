import { StoreConfig, StoreData } from "./store";
import defaultConfigs, { DefaultConfig } from "./defaultConfig";
import { Point, DataPoint } from "./interface";

interface RendererConfig extends StoreConfig {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  shadowCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  gradient: DefaultConfig["defaultGradient"];
  blur: DefaultConfig["defaultBlur"];
  backgroundColor: string;
  opacity: number;
  maxOpacity: number;
  minOpacity: number;
  useGradientOpacity: boolean;
}

class Renderer {
  canvas: HTMLCanvasElement;
  shadowCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  shadowCtx: CanvasRenderingContext2D | null;

  width: number;
  height: number;
  max: number;
  min: number;
  blur: number;
  opacity: number;
  maxOpacity: number;
  minOpacity: number;
  useGradientOpacity: boolean;

  renderBoundaries: number[];
  palette: Uint8ClampedArray;
  templates: any[];

  constructor(config: Partial<RendererConfig>) {
    this.canvas = config.canvas || document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.shadowCanvas = config.shadowCanvas || document.createElement("canvas");
    this.shadowCtx = this.shadowCanvas.getContext("2d");

    this.width = config.width || 512;
    this.height = config.height || 512;

    this.max = 100;
    this.min = 1;
    this.blur = 1;
    this.opacity = 1;
    this.maxOpacity = 1;
    this.minOpacity = 0;

    this.useGradientOpacity = false;

    this.canvas.style.cssText = this.shadowCanvas.style.cssText =
      "position:absolute;left:0;top:0;";

    if (config.container) {
      config.container.style.position = "relative";
      config.container.appendChild(this.canvas);
    }

    this.renderBoundaries = [10000, 10000, 0, 0];
    this.palette = this.getColorPalette(config);
    this.templates = [];

    this.setStyles(config);
  }

  private setStyles(config: Partial<RendererConfig>): void {
    this.blur = config.blur || defaultConfigs.defaultBlur;

    this.canvas.style.backgroundColor =
      config.backgroundColor || this.canvas.style.backgroundColor;

    this.width =
      this.canvas.width =
      this.shadowCanvas.width =
        config.width || this.width;

    this.height =
      this.canvas.height =
      this.shadowCanvas.height =
        config.height || this.height;

    this.opacity = (config.opacity || 0) * 255;
    this.maxOpacity =
      (config.maxOpacity || defaultConfigs.defaultMaxOpacity) * 255;
    this.minOpacity =
      (config.minOpacity || defaultConfigs.defaultMinOpacity) * 255;
    this.useGradientOpacity = !!config.useGradientOpacity;
  }

  private getColorPalette(config: Partial<RendererConfig>): Uint8ClampedArray {
    const gradientConfig = config.gradient || defaultConfigs.defaultGradient;
    const paletteCanvas = document.createElement("canvas");
    const paletteCtx = paletteCanvas.getContext("2d");

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    if (!paletteCtx) return new Uint8ClampedArray(1024);

    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    Object.entries(gradientConfig).forEach(([key, value]) => {
      gradient.addColorStop(+key, value);
    });

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  }

  renderPartial(resData: StoreData): void {
    if (resData.data.length <= 0) return;
    this.drawAlpha(resData);
    this.colorize();
  }

  renderAll(resData: StoreData): void {
    this.clear();
    if (resData.data.length <= 0) return;
    this.drawAlpha(this.prepareData(resData));
    this.colorize();
  }

  private drawAlpha(resData: StoreData): void {
    const min = (this.min = resData.min);
    const max = (this.max = resData.max);
    const data = resData.data || [];
    const blur = 1 - this.blur;

    [...data.reverse()].some((point) => {
      const { x, y, radius } = point;

      const value = Math.min(point.value, max);
      const rectX = x - radius;
      const rectY = y - radius;

      if (!this.shadowCtx) return true;

      let tpl;
      if (!this.templates[radius]) {
        this.templates[radius] = tpl = this.getPointTemplate(radius, blur);
      } else {
        tpl = this.templates[radius];
      }

      const templateAlpha = (value - min) / (max - min);

      this.shadowCtx.globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha;
      this.shadowCtx.drawImage(tpl, rectX, rectY);

      if (rectX < this.renderBoundaries[0]) {
        this.renderBoundaries[0] = rectX;
      }
      if (rectY < this.renderBoundaries[1]) {
        this.renderBoundaries[1] = rectY;
      }
      if (rectX + 2 * radius > this.renderBoundaries[2]) {
        this.renderBoundaries[2] = rectX + 2 * radius;
      }
      if (rectY + 2 * radius > this.renderBoundaries[3]) {
        this.renderBoundaries[3] = rectY + 2 * radius;
      }
    });
  }

  private getPointTemplate(
    radius: number,
    blurFactor: number
  ): HTMLCanvasElement {
    const tplCanvas = document.createElement("canvas");
    const tplCtx = tplCanvas.getContext("2d");

    if (!tplCtx) return tplCanvas;

    const [x, y] = [radius, radius];

    tplCanvas.width = tplCanvas.height = radius * 2;

    if (blurFactor === 1) {
      tplCtx.beginPath();
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      tplCtx.fillStyle = "rgba(0,0,0,1)";
      tplCtx.fill();
    } else {
      const gradient = tplCtx.createRadialGradient(
        x,
        y,
        radius * blurFactor,
        x,
        y,
        radius
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      tplCtx.fillStyle = gradient;
      tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
    }

    return tplCanvas;
  }

  private prepareData(resData: any): StoreData {
    const renderData: DataPoint[] = [];
    const { min, max, radi, data } = resData;

    const xValues = Object.keys(data);
    let xValuesLen = xValues.length;

    while (xValuesLen--) {
      const xValue = xValues[xValuesLen];
      const yValues = Object.keys(data[xValue]);

      let yValuesLen = yValues.length;

      while (yValuesLen--) {
        const yValue = yValues[yValuesLen];
        const value = data[xValue][yValue];
        const radius = radi[xValue][yValue];

        renderData.push({
          x: Number(xValue),
          y: Number(yValue),
          value,
          radius,
        });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData,
    };
  }

  updateConfig(config: RendererConfig): void {
    if (config.gradient) this.updateGradient(config);
    this.setStyles(config);
  }

  setDimensions(width: number, height: number): void {
    this.width = this.canvas.width = this.shadowCanvas.width = width;
    this.height = this.canvas.height = this.shadowCanvas.height = height;
  }

  getValueAt(point: Point): number {
    if (!this.shadowCtx) return 0;

    const img = this.shadowCtx.getImageData(point.x, point.y, 1, 1);

    return (Math.abs(this.max - this.min) * (img.data[3] / 255)) >> 0;
  }

  getDataURL(): string {
    return this.canvas.toDataURL();
  }

  private clear(): void {
    if (!this.ctx || !this.shadowCtx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.shadowCtx.clearRect(0, 0, this.width, this.height);
  }

  private updateGradient(config: Partial<RendererConfig>): void {
    this.palette = this.getColorPalette(config);
  }

  private colorize(): void {
    let [x, y] = this.renderBoundaries;
    const [, , x2, y2] = this.renderBoundaries;
    let [width, height] = [x2 - x, y2 - y];

    const [maxWidth, maxHeight] = [this.width, this.height];
    [x, y] = [x < 0 ? 0 : x, y < 0 ? 0 : y];
    [width, height] = [
      x + width > maxWidth ? maxWidth - x : width,
      y + height > maxHeight ? maxHeight - y : height,
    ];

    if (!this.ctx || !this.shadowCtx) return;

    const img: ImageData = this.shadowCtx.getImageData(x, y, width, height);

    for (let i = 3; i < img.data.length; i += 4) {
      const alpha = img.data[i];
      const offset = alpha * 4;

      if (!offset) continue;
      let finalAlpha;
      if (this.opacity > 0) {
        finalAlpha = this.opacity;
      } else {
        if (alpha < this.maxOpacity) {
          finalAlpha = alpha < this.minOpacity ? this.minOpacity : alpha;
        } else {
          finalAlpha = this.maxOpacity;
        }
      }

      img.data[i - 3] = this.palette[offset];
      img.data[i - 2] = this.palette[offset + 1];
      img.data[i - 1] = this.palette[offset + 2];
      img.data[i] = this.useGradientOpacity
        ? this.palette[offset + 3]
        : finalAlpha;
    }

    this.ctx.putImageData(img, x, y);
    this.renderBoundaries = [1000, 1000, 0, 0];
  }
}

export { RendererConfig };

export default Renderer;
