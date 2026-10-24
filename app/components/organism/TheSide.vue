<script setup vapor lang="ts">
const { loggedIn, menuItems } = useArchiveNavigation();
const { requestUpload } = useArchiveEvents();
</script>

<template>
  <aside class="border-r border-transparent bg-white flex-col hidden shadow-lg left-0 fixed z-50 dark:border-neutral-800/70 dark:bg-neutral-950 md:flex md:min-h-screen md:w-20">
    <div class="px-4 py-6 flexcenter">
      <NuxtImg src="/img/logo.jpg" alt="Ensik Archive" width="32" height="32" class="rounded-full" />
    </div>

    <nav class="flex-grow">
      <ul class="p-4 space-y-6">
        <li v-for="item in menuItems" :key="item.route">
          <NuxtLink
            :to="item.route"
            class="px-2 py-3 rounded-lg flexcenter transition-colors duration-200"
            :class="[
              item.active
                ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-strong'
                : 'hover:bg-neutral-100 text-muted dark:hover:bg-neutral-800',
            ]"
          >
            <div
              class="text-2xl transition-colors"
              :class="[
                item.icon,
                item.active ? 'text-blue-500 dark:text-blue-400' : '',
              ]"
            />
          </NuxtLink>
        </li>
        <li v-if="loggedIn">
          <AtomsButton
            variant="secondary"
            class="py-3 flexcenter w-full !px-2 !bg-transparent hover:!bg-neutral-100 dark:hover:!bg-neutral-800"
            title="Upload gambar"
            @click="requestUpload"
          >
            <div class="i-mingcute:plus-line text-2xl text-muted" />
          </AtomsButton>
        </li>
      </ul>
    </nav>

    <div class="px-4 py-6 flexcenter">
      <MoleculesColorMode />
    </div>
  </aside>
</template>
