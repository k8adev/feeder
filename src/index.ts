import chalk from 'chalk';
import yargs from 'yargs';
import Feeder from './feeder.js';
import Log from './log.js';

const argv = yargs(process.argv.slice(2))
  .usage(`
    Usage: $0 [options]
  `)
  .option({
    rss: {
      alias: 'r',
      describe: 'RSS URL',
      required: true,
      requiresArg: true,
      type: 'string',
    },
    file: {
      alias: 'f',
      describe: 'RSS file name',
      required: false,
      requiresArg: true,
      type: 'string',
      default: 'rss.xml',
    },
    output: {
      alias: 'o',
      describe: 'Output directory',
      required: false,
      requiresArg: true,
      type: 'string',
      default: './public',
    },
    json: {
      alias: 'j',
      describe: 'Output JSON file',
      required: false,
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    parser: {
      alias: 'p',
      describe: 'RSS parser',
      required: false,
      requiresArg: true,
    },
  })
  .parseSync();

const {
  rss,
  file,
  output,
} = argv;

const feeder = new Feeder(
  rss,
  file,
  { output },
);

try {
  if (argv.parser) {
    await feeder.useDataParser(argv.parser);
  }

  if (argv.json) {
    await feeder.asJSON();
  }

  /**
   * XML is mandatory output.
   */
  await feeder.asXML();

  Log.success(
    `RSS feed ${chalk.bold(rss)} has been successfully fetched.`,
  );
} catch (err) {
  Log.error(err);
}
