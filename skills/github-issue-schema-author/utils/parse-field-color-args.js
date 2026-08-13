import { parseFieldMutationArgs } from './parse-field-mutation-args.js';

/** Parse the color-only field plan and apply command. */
export function parseFieldColorArgs(argv) {
  return parseFieldMutationArgs(argv);
}
