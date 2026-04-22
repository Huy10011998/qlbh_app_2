type RefetchSource = "network" | "foreground";

type Listener = (source: RefetchSource) => void;

const listeners = new Set<Listener>();

export const subscribeAppRefetch = (cb: Listener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const emitAppRefetch = (source: RefetchSource) => {
  listeners.forEach((cb) => cb(source));
};
