interface CMPA {
  palette: () => [number, number, number][];
}

declare module 'quantize' {
  export default function quantize(
    pixels: [number, number, number][],
    colorCount: number
  ): CMPA;
}
