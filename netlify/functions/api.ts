import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { app } from "../../apps/api/dist/app.js";

const expressHandler = serverless(app, {
  basePath: "/.netlify/functions/api"
});

export const handler: Handler = async (event, context) => {
  return (await expressHandler(event, context)) as any;
};
