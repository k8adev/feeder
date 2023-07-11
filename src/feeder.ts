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
  private parserRSSData: any = (data: any) => data;

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
   * Fetch the RSS.
   */
  async getRss() {
    const response = await fetch(this.url);

    if (!response.ok) {
      throw new Error(
        `Fetch RSS from ${chalk.cyan(this.url)} failed`
      );
    }

    const data = await response.text();

    return data;
  }
  /**
   * Check if the output directory exists and
   * create it if it doesn't.
   */
  async createDir() {
    const dir = path.dirname(this.file);
    const hasFile = fs.existsSync(dir);

    if (hasFile) {
      return;
    }

    await fs.promises.mkdir(
      dir,
      { recursive: true },
    );
  }
  /**
   * Add the RSS file to the output directory.
   */
  async addFile(
    data,
    ext = '.xml',
  ) {
    await this.createDir();

    const { dir, name } = path.parse(this.file);
    const file = path.format({
      dir,
      name,
      ext,
    });

    await fs.promises.writeFile(
      file,
      data,
    );
  }
  /**
   * Use a custom parser to transform the RSS data.
   */
  async useDataParser(parser) {
    const { default: fn } = await import(
      path.resolve(parser)
    );

    if (typeof fn !== 'function') {
      throw new Error(
        'Parser must be a function.',
      );
    }

    /**
     * @todo
     * Maybe need to check if the parser has async/await?
     */
    this.parserRSSData = fn;
  }

  async asXML() {
    const data = await this.getRss();
    const parsedData = this.parserRSSData(data);

    await this.addFile(
      parsedData,
      '.xml',
    );
  }

  async asJSON() {
    const data = await this.getRss();
    const rss = new RSSParser();

    const strData = await rss.parseString(data);
    const parsedData = await this.parserRSSData(strData);

    await this.addFile(
      JSON.stringify(parsedData),
      '.json',
    );
  }
}
