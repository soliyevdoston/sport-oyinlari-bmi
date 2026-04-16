export const logger = {
  info: (message: string, payload?: unknown) => {
    if (payload) {
      console.log(`[info] ${message}`, payload);
      return;
    }
    console.log(`[info] ${message}`);
  },
  error: (message: string, payload?: unknown) => {
    if (payload) {
      console.error(`[error] ${message}`, payload);
      return;
    }
    console.error(`[error] ${message}`);
  }
};
