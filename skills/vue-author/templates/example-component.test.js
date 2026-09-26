import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, expect, it } from 'vitest';
import ExampleComponent from '../components/example-component.vue';

enableAutoUnmount(afterEach);

it('updates fallback title text when the prop changes', async () => {
  const wrapper = mount(ExampleComponent, { props: { title: 'First title' } });

  expect(wrapper.get('header').text()).toBe('First title');
  await wrapper.setProps({ title: 'Updated title' });
  expect(wrapper.get('header').text()).toBe('Updated title');
});

it('renders the title slot instead of fallback text', () => {
  const wrapper = mount(ExampleComponent, {
    props: { title: 'Fallback title' },
    slots: { title: '<strong>Custom title</strong>' },
  });

  expect(wrapper.get('header').text()).toBe('Custom title');
});
