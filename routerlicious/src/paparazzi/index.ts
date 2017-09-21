import * as nconf from "nconf";
import * as path from "path";
import * as winston from "winston";
import * as utils from "../utils";
import { PaparazziRunner } from "./runner";

const provider = nconf.argv().env(<any> "__").file(path.join(__dirname, "../../config/config.json")).use("memory");

// Configure logging
utils.configureLogging(provider.get("logger"));

async function run(config: nconf.Provider) {
    // Connect to alfred and tmz and subscribes for work.
    const alfredUrl = provider.get("paparazzi:alfred");
    const tmzUrl = provider.get("paparazzi:tmz");
    const workerConfig = provider.get("worker");
    const gitConfig = provider.get("git");

    const runner = new PaparazziRunner(alfredUrl, tmzUrl, workerConfig, gitConfig.historian, gitConfig.repository);
    const runningP = runner.start();

    process.on("SIGTERM", () => {
        runner.stop();
    });

    return runningP;
}

// Start up the paparazzi service
winston.info("Starting");
const runP = run(provider);
runP.then(
    () => {
        winston.info("Exiting");
    },
    (error) => {
        winston.error(error);
        process.exit(1);
    });
