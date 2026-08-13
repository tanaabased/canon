import { parseFieldMutationArgs } from './parse-field-mutation-args.js';

/** Parse the additive-only field plan and apply command. */
export function parseFieldAdditionArgs(argv) {
  return parseFieldMutationArgs(argv);
}
