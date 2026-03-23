import md5 from "react-native-md5";

// Hash MD5
export function md5Hash(input: string): string {
  return md5.hex_md5(input);
}

// Promise với timeout
export const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
