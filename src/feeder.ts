import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import RSSParser from 'rss-parser';
import chalk from 'chalk';

type FeederOptions = {
  /**
   * Output directory.
   * @defaultValue ./public
   */
  output?: string;
};

/**
 * @example
 * const feeder = new Feeder(
 *  'https://example.com/rss.xml',
 *  'rss.xml',
 *  { output: './public' },
 * );
 */
export default class Feeder {
  /**
   * RSS feed URL.
   */
  url: string;
  /**
   * RSS file name. Extension will be ignored
   * if the output is JSON.
   * @defaultValue rss.xml
   */
  file: string;
  /**
   * Transform the RSS data with a custom parser.
   */
  private transform: any = (data: any) => data;

  constructor(
    rss: string,
    filename = 'rss.xml',
    options: FeederOptions = {},
  ) {
    const output = options?.output || './public';

    this.url = rss;
    this.file = path.resolve(
      path.join(
        output,
        filename,
      ),
    );
  }
  /**
   * Fetch the RSS feed.
   */
  async getRss() {
    return fetch(this.url)
      .then((response) => response.text())
      .finally(() => {
        console.log(
          `${chalk.green('✔')} RSS feed fetched`
        );
      });
  }
  /**
   * Check if the output directory exists and
   * create it if it doesn't.
   */
  async checkOutDir() {
    const dir = path.dirname(this.file);
    const recursive = true;

    if (await fs.existsSync(dir)) {
      return;
    }

    await fs.mkdir(
      dir,
      { recursive },
      (err: any) => {
        if (err) {
          throw err;
        }

        console.log(
          `${chalk.green('✔')} Output directory created`
        );
      },
    );
  }

  /**
   * Add the RSS file to the output directory.
   */
  async addFile(
    data,
    ext = '.xml',
  ) {
    await this.checkOutDir();

    const { dir, name } = path.parse(this.file);
    const file = path.format({
      dir,
      name,
      ext,
    });

    await fs.writeFile(
      file,
      data,
      (err: any) => {
        if (err) {
          throw err;
        }

        console.log(
          `${chalk.green('✔')} File ${ext} created`
        );
      },
    );
  }

  async useParser(parser: any) {
    const { default: fn } = await import(
      path.resolve(parser)
    );

    if (typeof fn !== 'function') {
      throw new Error(
        'Parser must be a function',
      );
    }

    this.transform = fn;
  }

  async asXML() {
    const rssData = await this.getRss();
    const parsedData = this.transform(rssData);

    await this.addFile(
      parsedData,
      '.xml',
    );
  }

  async asJSON() {
    const rss = new RSSParser();
    const rssData = await this.getRss();
    const data = await rss.parseString(rssData);
    const parsedData = this.transform(data);

    await this.addFile(
      JSON.stringify(parsedData),
      '.json',
    );
  }
}
