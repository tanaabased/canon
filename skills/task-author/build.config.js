export default {
  entrypoints: ['scripts/*.js'],
  copy: ['references/**', 'templates/**', '!templates/packaged-command-execution.md'],
};
