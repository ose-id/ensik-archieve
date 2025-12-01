<script setup lang="ts">
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const { loggedIn, fetch: fetchSession } = await useUserSession();
const route = useRoute();
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

if (import.meta.client) {
  await fetchSession();
}

const menuItems = computed<MenuItem[]>(() => [
  { icon: 'i-mingcute:home-6-line', label: 'Home', route: '/' },
  ...(loggedIn.value
    ? [
        { icon: 'i-mingcute:dashboard-line', label: 'Dashboard', route: '/dashboard' },
      ]
    : []),
]);

const currentPath = computed(() => route.path);

function isActive(path: string) {
  if (path === '/')
    return currentPath.value === '/';

  return currentPath.value === path || currentPath.value.startsWith(`${path}/`);
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !loggedIn.value)
    return;

  if (file.size > 2 * 1024 * 1024) {
    console.warn('File size exceeds 2MB limit!');
    if (fileInputRef.value)
      fileInputRef.value.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    console.warn('Please upload an image file.');
    if (fileInputRef.value)
      fileInputRef.value.value = '';
    return;
  }

  isUploading.value = true;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response || !response.ok)
      throw new Error('Upload failed');

    window.location.reload();
  }
  catch (error) {
    console.error('Upload failed:', error);
  }
  finally {
    isUploading.value = false;
    if (fileInputRef.value)
      fileInputRef.value.value = '';
  }
}
</script>

<template>
  <aside class="fixed left-0 z-50 hidden flex-col border-r-1 border-transparent border-r-solid bg-white shadow-lg md:min-h-screen md:w-20 md:flex dark:border-neutral-800/70 dark:bg-neutral-950">
    <div flexcenter px-4 py-6>
      <NuxtImg src="/img/logo.jpg" alt="Logo" size-6 rounded-full md:size-8 />
    </div>

    <!-- Navigation Menu -->
    <nav flex-grow>
      <ul list-none p-4 space-y-6>
        <li v-for="item in menuItems" :key="item.label">
          <NuxtLink
            :to="item.route"
            class="flexcenter rounded-lg px-2 py-3 transition-colors duration-200"
            :class="[
              isActive(item.route)
                ? ' hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'hover:bg-neutral-100 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800',
            ]"
          >
            <div
              class="text-2xl transition-colors"
              :class="[
                item.icon,
                isActive(item.route) ? 'text-blue-500 dark:text-blue-400' : '',
              ]"
            />
          </NuxtLink>
        </li>

        <!-- Upload Button -->
        <li v-if="loggedIn">
          <button
            class="w-full flexcenter cursor-pointer rounded-lg border-none bg-transparent px-2 py-3 transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            :disabled="isUploading"
            title="Upload Image"
            @click="triggerUpload"
          >
            <div v-if="isUploading" i-mingcute:loading-line animate-spin text-2xl text-blue-500 />
            <div v-else i-mingcute:plus-line text-2xl text-neutral-500 dark:text-neutral-400 />
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          >
        </li>
      </ul>
    </nav>

    <div flexcenter px-4 py-6>
      <ColorMode />
    </div>
  </aside>
</template>
