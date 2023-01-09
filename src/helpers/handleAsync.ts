export function handleAsync<T, U = Error>(
  promise: Promise<T>,
): Promise<[U, undefined] | [undefined, T]> {
  return promise
    .then<[undefined, T]>((data: T) => [undefined, data])
    .catch<[U, undefined]>((err: U) => [err, undefined]);
}

export default handleAsync;
