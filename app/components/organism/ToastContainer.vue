<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="pointer-events-none fixed bottom-0 right-0 z-[9999] w-full flex flex-col justify-end p-4 sm:w-auto md:p-6">
    <TransitionGroup
      name="toast"
      tag="div"
      class="w-full flex flex-col items-end gap-3"
    >
      <div v-for="toast in toasts" :key="toast.id" class="pointer-events-auto w-full rounded-xl shadow-2xl sm:w-auto">
        <MoleculesToast
          :id="toast.id"
          :message="toast.message"
          :type="toast.type"
          :duration="toast.duration ?? 10000"
          @close="removeToast"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-move, /* apply transition to moving elements */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.toast-leave-active {
  position: absolute;
}
</style>
