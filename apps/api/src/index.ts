import { buildServer } from "./server.js";
import { env } from "./env.js";

const app = buildServer();

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API running on port ${env.PORT}`);
});
