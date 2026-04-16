import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./core/logger.js";

app.listen(env.API_PORT, env.API_HOST, () => {
  logger.info(`API listening on http://${env.API_HOST}:${env.API_PORT}${env.API_PREFIX}`);
});
