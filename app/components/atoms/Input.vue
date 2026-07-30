<script setup lang="ts">
withDefaults(defineProps<{
  id?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
}>(), {
  autocomplete: undefined,
  id: undefined,
  placeholder: undefined,
  required: false,
  type: 'text',
});

const model = defineModel<string | number>({ required: true });
</script>

<template>
  <input
    :id="id"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :autocomplete="autocomplete"
    class="box-border h-10 w-full border border-zinc-800 rounded-md bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors duration-200 dark:border-neutral-700 focus:border-zinc-600 dark:bg-neutral-900 dark:text-neutral-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-600 dark:focus:border-neutral-500 dark:placeholder:text-neutral-500"
  >
</template>
