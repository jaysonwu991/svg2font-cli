import { Command } from "commander";
import { DEFAULT_CLI_OPTIONS } from "../defaults";
import { generateIconfont } from "../core/generate";
import { CliOptions } from "../types";

export const runCli = async (): Promise<void> => {
  const program = new Command()
    .name("svg2font")
    .description("Convert SVG icons into a downloadable iconfont zip (similar to iconfont.cn).")
    .option(
      "-i, --input <path>",
      "Directory or glob pattern for SVG files",
      DEFAULT_CLI_OPTIONS.input,
    )
    .option(
      "-o, --output <dir>",
      "Output directory for the generated zip",
      DEFAULT_CLI_OPTIONS.output,
    )
    .option("-n, --name <fontName>", "Font name used in files and CSS", DEFAULT_CLI_OPTIONS.name)
    .option("-p, --prefix <classPrefix>", "CSS class prefix", DEFAULT_CLI_OPTIONS.prefix)
    .option("--no-optimize", "Disable SVGO optimization", DEFAULT_CLI_OPTIONS.optimize)
    .parse(process.argv);

  const options = program.opts<CliOptions>();
  const { zipPath, glyphs } = await generateIconfont(options);

  console.log(`Generated ${glyphs.length} icons into ${zipPath}`);
};
