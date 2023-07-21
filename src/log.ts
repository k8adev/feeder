import chalk from 'chalk';

export default class Log {
  static error(message: string) {
    console.log(
      `${chalk.red('✖ DO NOT PANIC!')} Check the error below 👇\n`,
    );
    /**
     * Use @func console.error to log complete error stack.
     */
    console.error(message);
  }
  static success(message: string) {
    console.log(
      `${chalk.green('✔')} ${message}`,
    );
  }
}
