import {Argv} from 'yargs';

abstract class Command {
  protected command : string = 'DEFAULT_COMMAND';

  protected description : string = 'DEFAULT_DESCRIPTION';

  abstract builder(yargs : Argv) : any;

  /**
   * @abstract
   * @method exec
   * @param yargs: arguments nedded for the command
   */
  abstract async exec(args : any) : Promise<string>;

  /**
   * @method getCommand
   * @returns the command string
   */
  getCommand() : string {
    return this.command;
  }

  /**
   * @method getDescription
   * @returns the command's description
   */
  getDescription() : string {
    return this.description;
  }
}

export default Command;
