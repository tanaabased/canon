import { readLargeIconBase64 } from './read-large-icon-base64.js' with { type: 'macro' };

export default Buffer.from(readLargeIconBase64(), 'base64');
