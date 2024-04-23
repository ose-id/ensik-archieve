<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

let selectedImage: File | null = null;

function generateRandomCode(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));

  return result;
}

async function uploadImage(file: File) {
  const randomCode = generateRandomCode(5);
  const originalFileName = file.name;

  const newFileName = `${randomCode}-${originalFileName}`;

  const { error } = await supabase.storage.from('post').upload(`${newFileName}`, file);

  if (error)
    alert(error.message);
  else
    alert('Image uploaded successfully');
}

function handleFileUpload(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.[0];

  if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    selectedImage = file;
  }
  else {
    alert('Select an image file with the extension .jpg or .png.');
    fileInput.value = '';
    selectedImage = null;
  }
}

async function uploadSelectedImage() {
  if (!selectedImage) {
    alert('Select an image!');
    return;
  }

  await uploadImage(selectedImage);

  router.push('/');
}
</script>

<template>
  <section class="flex items-center justify-center mx-auto container min-h-screen">
    <div class="space-y-4 flex flex-col">
      <input
        type="file"
        accept=".png, .jpg"
        class="block w-full text-sm text-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        @change="handleFileUpload"
      >
      <button class="py-2 px-3 bg-blue-300 rounded-md my-2 text-center" @click="uploadSelectedImage">
        Post
      </button>
    </div>
  </section>
</template>
