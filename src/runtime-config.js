// Static hosting uses this safe default. The local Node server serves a
// runtime-specific copy so browser code never receives the API key.
export const runtimeConfig = Object.freeze({
  remoteProviderEnabled: false,
  model: 'nvidia/Nemotron-3_5-Lightning'
});
