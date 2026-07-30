<template>
  <div class="min-h-screen bg-white dark:bg-black">
    <OrganismTheSide />
    <OrganismTheNav />

    <main class="px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-20 md:ml-20 lg:px-8 md:px-5 md:pb-8">
      <slot />
    </main>

    <OrganismMobileBottomNav />
    <OrganismImageUpload />
  </div>
</template>
