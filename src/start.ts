import { program } from "commander";
import { runMine } from "./scripts/mint";

program
  .command("mine <num>")
  .description("Perform Ethernet Nonce POW Mining")
  .action((num) => {
    runMine(num);
  });

program.parse(process.argv);
