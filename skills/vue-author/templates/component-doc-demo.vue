<template>
  <div class="component-doc-demo">
    <section class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Controls</h3>
      <p class="component-doc-demo__description">
        <slot name="controls-description">
          Adjust the controls to update both the live preview and the code sample.
        </slot>
      </p>
      <div class="component-doc-demo__controls">
        <slot name="controls" />
      </div>
    </section>

    <section class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Preview</h3>
      <div class="component-doc-demo__preview">
        <slot name="preview" />
      </div>
    </section>

    <section v-if="props.code" class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Code</h3>
      <div class="component-doc-demo__code" v-html="renderedCodeBlock"></div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useData } from 'vitepress';

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  source: {
    type: [Boolean, String],
    default: true,
  },
});

const { page, theme } = useData();

const shikiThemes = {
  light: 'github-light',
  dark: 'github-dark',
};

let highlighterPromise;
let renderSequence = 0;

function getHighlighter() {
  highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/langs/html.mjs'),
    import('shiki/themes/github-light.mjs'),
    import('shiki/themes/github-dark.mjs'),
  ]).then(
    ([
      { createHighlighterCore },
      { createJavaScriptRegexEngine },
      html,
      githubLight,
      githubDark,
    ]) => {
      return createHighlighterCore({
        themes: [githubLight.default, githubDark.default],
        langs: [html.default],
        engine: createJavaScriptRegexEngine(),
      });
    },
  );

  return highlighterPromise;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function renderSourceLink(sourceHref) {
  if (!sourceHref) {
    return '';
  }

  return `<a class="component-doc-demo__source" href="${escapeAttribute(sourceHref)}" target="_blank" rel="noreferrer" aria-label="View component source">source</a>`;
}

function renderPlainCodeBlock(code, sourceHref) {
  return `<div class="language-html vp-adaptive-theme"><button type="button" title="Copy Code" aria-label="Copy code" class="copy"></button><span class="lang">html</span><pre class="vp-code"><code>${escapeHtml(code)}</code></pre>${renderSourceLink(sourceHref)}</div>`;
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//.test(value);
}

function normalizeRepository(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function toPascalComponentName(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function inferSourcePath(relativePath) {
  if (!relativePath?.startsWith('components/') || !relativePath.endsWith('.md')) {
    return '';
  }

  const fileName = relativePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const componentName = toPascalComponentName(fileName);

  return componentName ? `components/${componentName}.vue` : '';
}

function resolveSourcePath() {
  if (props.source === false || props.source === '') {
    return '';
  }

  if (typeof props.source === 'string') {
    return props.source;
  }

  return inferSourcePath(page.value.relativePath);
}

async function renderCodeBlock(code, sourceHref) {
  const highlighter = await getHighlighter();

  const highlighted = highlighter.codeToHtml(code, {
    lang: 'html',
    themes: shikiThemes,
    defaultColor: false,
  });

  const pre = highlighted.replace(
    '<pre class="shiki shiki-themes github-light github-dark"',
    '<pre class="shiki shiki-themes github-light github-dark vp-code"',
  );

  return `<div class="language-html vp-adaptive-theme"><button type="button" title="Copy Code" aria-label="Copy code" class="copy"></button><span class="lang">html</span>${pre}${renderSourceLink(sourceHref)}</div>`;
}

const resolvedSourceHref = computed(() => {
  const sourcePath = resolveSourcePath();

  if (!sourcePath) {
    return '';
  }

  if (isAbsoluteUrl(sourcePath)) {
    return sourcePath;
  }

  const repository = normalizeRepository(theme.value.repository);

  if (!repository) {
    return '';
  }

  return `${repository}/blob/main/${sourcePath.replace(/^\/+/, '')}`;
});

const renderedCodeBlock = ref('');

watch(
  [() => props.code, resolvedSourceHref],
  async ([value, sourceHref]) => {
    const sequence = ++renderSequence;

    if (!value) {
      renderedCodeBlock.value = '';
      return;
    }

    renderedCodeBlock.value = renderPlainCodeBlock(value, sourceHref);
    let highlighted;
    try {
      highlighted = await renderCodeBlock(value, sourceHref);
    } catch {
      // Keep the plain VitePress code block when Shiki is unavailable.
      return;
    }

    if (sequence === renderSequence) {
      renderedCodeBlock.value = highlighted;
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.component-doc-demo {
  display: block;
}
</style>
