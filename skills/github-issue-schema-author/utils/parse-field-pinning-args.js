import { parseFieldMutationArgs } from './parse-field-mutation-args.js';

/** Parse the browser-backed field-pinning plan and authorization commands. */
export function parseFieldPinningArgs(argv) {
  return parseFieldMutationArgs(argv, { mutationCommand: 'authorize' });
}
