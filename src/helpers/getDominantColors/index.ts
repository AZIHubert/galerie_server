import quantize from 'quantize';
import Jimp from 'jimp';

const componentToHex = (c: number) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

const rgbToHex = (r: number, g: number, b: number) => `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const getPixels = async (img: Buffer, quality = 10) => {
  const image = await Jimp.read(img);
  const pixels: [number, number, number][] = [];
  const { width } = image.bitmap;
  const { height } = image.bitmap;
  for (let y = 0; y < height; y += quality) {
    for (let x = 0; x < width; x += quality) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (
        (typeof pixel.a === 'undefined' || pixel.a >= 125)
        && !(pixel.r > 250 && pixel.g > 250 && pixel.b > 250)
      ) {
        pixels.push([pixel.r, pixel.g, pixel.b]);
      }
    }
  }
  return pixels;
};

export default async (img: Buffer, colorCount = 10, quality = 5) => {
  const pixels = await getPixels(img, quality);
  const cmap = quantize(pixels, colorCount);
  if (!cmap) {
    return null;
  }
  const palette = cmap.palette();
  const hexPalette = `${palette[0] && rgbToHex(...palette[0])}${palette[1] && `,${rgbToHex(...palette[1])}${palette[2] && `,${rgbToHex(...palette[2])}`}`}`;
  return hexPalette || null;
};
