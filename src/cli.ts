import { runCli } from "./cli/run";

runCli().catch((err: Error) => {
  console.error(err.message || err);
  process.exit(1);
});
