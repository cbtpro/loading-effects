import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createLoading, progressAttributes } from '@loading-effects/core';

export const LoadingEffect = defineComponent({
  name: 'LoadingEffect',
  props: {
    effect: { type: String, required: true },
    registry: { type: Object, required: true },
    options: { type: Object, default: () => ({}) },
    label: { type: String, default: '正在加载' },
  },
  setup(props, { expose }) {
    const element = ref(null);
    let loading;

    function mount() {
      loading?.destroy();
      loading = createLoading(element.value, { ...props.options, effect: props.effect }, props.registry);
    }

    onMounted(mount);
    watch([() => props.effect, () => props.registry], () => {
      if (loading) mount();
    });
    watch(() => props.options, options => loading?.replaceOptions(options), { deep: true });
    onBeforeUnmount(() => {
      loading?.destroy();
      loading = undefined;
    });
    expose({ trigger: origin => loading?.trigger(origin) });

    return () => h('div', {
      ref: element,
      ...progressAttributes(props.registry.effects?.[props.effect], props.options, props.label),
    });
  },
});
