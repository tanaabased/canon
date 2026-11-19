import { Glob } from 'bun';

export default function selectBuildFiles(files, patterns) {
  const include = [];
  const exclude = [];
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) exclude.push(new Glob(pattern.slice(1)));
    else include.push(new Glob(pattern));
  }
  return files.filter(
    (file) => include.some((glob) => glob.match(file)) && !exclude.some((glob) => glob.match(file)),
  );
}
