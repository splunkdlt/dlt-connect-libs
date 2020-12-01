export const concatMetricName = (base: string, ext: string, useDotNotation: boolean) =>
    base + (useDotNotation ? '.' : '_') + ext;
