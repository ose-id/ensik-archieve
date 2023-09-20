<template>
  <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 py-12 space-y-4">
    <NuxtImg v-for="item in img" :key="item.i" :src="item.i" :class="imgStyle" loading="lazy" alt="" placeholder />
  </div>
</template>

<script setup>
const imgStyle = "rounded-lg";
const supabase = useSupabaseClient();

async function fetchPostFileNames() {
  try {
    const { data, error } = await supabase.storage.from("post").list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      return data.map((item) => item.name);
    }
  } catch (error) {
    console.error(error);
  }
}

async function getPhotoUrls(fileNames) {
  try {
    const signedUrls = await Promise.all(
      fileNames.map(async (fileName) => {
        const { data, error } = await supabase.storage.from("post").createSignedUrl(fileName, 60);
        if (error) {
          console.error(error);
          return null;
        } else if (data && data.signedUrl) {
          return data.signedUrl;
        } else {
          return null;
        }
      })
    );

    return signedUrls.filter((url) => url !== null);
  } catch (error) {
    console.error(error);
    return [];
  }
}

const img = ref([]);
const postFileNames = ref([]);

onMounted(async () => {
  const fileNames = await fetchPostFileNames();

  if (fileNames && fileNames.length > 0) {
    postFileNames.value = fileNames;
    const photoUrls = await getPhotoUrls(fileNames);
    img.value = photoUrls.map((url, i) => ({ i: url }));
  } else {
    console.error('No files found in the "post" bucket.');
  }
});
</script>
