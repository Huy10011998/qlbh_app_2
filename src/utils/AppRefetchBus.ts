type RefetchSource = "network" | "foreground" | "notification";
type Listener = (source: RefetchSource) => void;

const listeners = new Set<Listener>();

export const subscribeAppRefetch = (cb: Listener): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  }; // ← trả về void thay vì boolean
};

export const emitAppRefetch = (source: RefetchSource) => {
  listeners.forEach((cb) => cb(source));
};
