<script setup vapor lang="ts">
const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 flex flex-col w-full pointer-events-none bottom-0 right-0 justify-end fixed z-[9999] md:p-6 sm:w-auto">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3 w-full items-end"
    >
      <div v-for="toast in toasts" :key="toast.id" class="rounded-xl w-full pointer-events-auto shadow-2xl sm:w-auto">
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
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
    transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-active {
  position: absolute;
}
</style>
