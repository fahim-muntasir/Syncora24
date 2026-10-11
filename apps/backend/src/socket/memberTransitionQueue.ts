const transitions = new Map<string, Promise<void>>();

export const withMemberTransition = async <T>(
  key: string,
  action: () => Promise<T>,
): Promise<T> => {
  const previous = transitions.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  transitions.set(key, current);

  await previous;
  try {
    return await action();
  } finally {
    release();
    if (transitions.get(key) === current) {
      transitions.delete(key);
    }
  }
};
