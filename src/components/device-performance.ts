type BrowserDevice = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function prefersLightweightMode() {
  const { deviceMemory, hardwareConcurrency, connection } = navigator as BrowserDevice;
  const limitedMemory = deviceMemory === undefined ? hardwareConcurrency <= 4 : deviceMemory <= 2;
  return limitedMemory || hardwareConcurrency <= 2 || Boolean(connection?.saveData || connection?.effectiveType?.endsWith('2g'));
}
