import chalk from 'chalk';
import yargs from 'yargs';
import Feeder from './feeder.js';

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

if (argv.parser) {
  feeder.useParser(argv.parser);
}

(async () => {
  try {
    if (argv.json) {
      await feeder.asJSON();
    } else {
      /**
       * Default option.
       */
      await feeder.asXML();
    }

    console.log(
      `${chalk.green('✔')} Done!`
    );
  } catch (err) {
    console.error(
      `${chalk.red('✖')} DO NOT PANIC! Check the error below:`
    );
    console.error(err);
  }
})();
