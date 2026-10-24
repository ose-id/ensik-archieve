<script setup vapor lang="ts">
withDefaults(defineProps<{
  autocomplete?: string;
  describedby?: string;
  /** Icon class shown at the start of the field, e.g. `i-mingcute:lock-line`. */
  icon?: string;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  required?: boolean;
  type?: string;
}>(), {
  autocomplete: undefined,
  describedby: undefined,
  icon: undefined,
  id: undefined,
  invalid: false,
  placeholder: undefined,
  required: false,
  type: 'text',
});

const model = defineModel<string>({ required: true });
const slots = useSlots();
</script>

<template>
  <!-- The wrapper draws the border and focus ring so icons and trailing actions sit inside one field. -->
  <div
    class="group border rounded-xl bg-zinc-950/70 flex h-12 transition-[border-color,box-shadow] duration-150 items-center relative focus-within:ring-4"
    :class="invalid
      ? 'border-red-500/70 focus-within:(border-red-400 ring-red-500/15)'
      : 'border-zinc-700/80 hover:border-zinc-600 focus-within:(border-zinc-400 ring-zinc-400/15)'"
  >
    <span
      v-if="icon"
      class="ml-3.5 shrink-0 size-5 pointer-events-none transition-colors"
      :class="[icon, invalid ? 'text-red-400' : 'text-zinc-500 group-focus-within:text-zinc-300']"
      aria-hidden="true"
    />
    <!-- 16px text keeps iOS Safari from zooming in when the field is focused. -->
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
      class="text-base text-zinc-100 pr-3 outline-none bg-transparent flex-1 h-full min-w-0 placeholder:text-zinc-500"
      :class="icon ? 'pl-3' : 'pl-4'"
    >
    <div v-if="slots.trailing" class="mr-1.5 flex shrink-0 items-center">
      <slot name="trailing" />
    </div>
  </div>
</template>
