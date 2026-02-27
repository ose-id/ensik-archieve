<script setup lang="ts">
import type { ToastType } from '~/composables/useToast';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}>();

const emit = defineEmits<{
  close: [id: string];
}>();

const progress = ref(100);
let intervalId: number;
let timeoutId: number;
const updateInterval = 10; // Update progress every 10ms for smooth animation

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  error: 'bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  warning: 'bg-yellow-100 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
};

const iconClasses: Record<ToastType, string> = {
  success: 'i-mingcute:check-circle-fill text-green-500',
  error: 'i-mingcute:close-circle-fill text-red-500',
  info: 'i-mingcute:information-fill text-blue-500',
  warning: 'i-mingcute:warning-fill text-yellow-500',
};

const progressClasses: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

onMounted(() => {
  if (props.duration > 0) {
    const step = (updateInterval / props.duration) * 100;

    intervalId = window.setInterval(() => {
      progress.value = Math.max(0, progress.value - step);
    }, updateInterval);

    timeoutId = window.setTimeout(() => {
      emit('close', props.id);
    }, props.duration);
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

function handleClose() {
  emit('close', props.id);
}
</script>

<template>
  <div
    class="relative w-full overflow-hidden border rounded-lg border-solid shadow-lg md:w-96 sm:w-80"
    :class="typeClasses[props.type]"
    role="alert"
  >
    <div class="flex items-center gap-3 p-4">
      <div :class="iconClasses[props.type]" class="flex shrink-0 items-center text-2xl" />
      <p class="m-0 flex flex-1 items-center text-sm font-medium leading-normal">
        {{ message }}
      </p>

      <button
        type="button"
        class="m-0 ml-2 flex shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 opacity-70 outline-none transition-all active:scale-95 hover:scale-110 hover:opacity-100"
        :class="[
          props.type === 'error' ? 'text-red-600 dark:text-red-400' : '',
          props.type === 'success' ? 'text-green-600 dark:text-green-400' : '',
          props.type === 'info' ? 'text-blue-600 dark:text-blue-400' : '',
          props.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : '',
        ]"
        @click="handleClose"
      >
        <div class="i-mingcute:close-line text-2xl" />
      </button>
    </div>

    <!-- Progress Bar -->
    <div v-if="duration > 0" class="absolute bottom-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10">
      <div
        class="h-full origin-left transition-all duration-[10ms] ease-linear"
        :class="progressClasses[props.type]"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
