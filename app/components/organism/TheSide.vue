<script setup lang="ts">
const { loggedIn, menuItems } = useArchiveNavigation();
const { requestUpload } = useArchiveEvents();
</script>

<template>
  <aside class="fixed left-0 z-50 hidden flex-col border-r-1 border-transparent border-r-solid bg-white shadow-lg md:min-h-screen md:w-20 md:flex dark:border-neutral-800/70 dark:bg-neutral-950">
    <div flexcenter px-4 py-6>
      <NuxtImg src="/img/logo.jpg" alt="Ensik Archive" width="32" height="32" rounded-full />
    </div>

    <nav flex-grow>
      <ul list-none p-4 space-y-6>
        <li v-for="item in menuItems" :key="item.route">
          <NuxtLink
            :to="item.route"
            class="flexcenter rounded-lg px-2 py-3 transition-colors duration-200"
            :class="[
              item.active
                ? ' hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'hover:bg-neutral-100 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800',
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
            class="w-full flexcenter py-3 !bg-transparent !px-2 hover:!bg-neutral-100 dark:hover:!bg-neutral-800"
            title="Upload gambar"
            @click="requestUpload"
          >
            <div i-mingcute:plus-line text-2xl text-neutral-500 dark:text-neutral-400 />
          </AtomsButton>
        </li>
      </ul>
    </nav>

    <div flexcenter px-4 py-6>
      <MoleculesColorMode />
    </div>
  </aside>
</template>
