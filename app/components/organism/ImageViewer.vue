<script setup vapor lang="ts">
import type { ArchiveImage } from '~~/shared/types/images';
import type { MasonryItem } from '~/composables/useArchiveMasonry';

const props = defineProps<{
  items: MasonryItem[];
  /** Called when stepping past the last item, so the owner can load the next page first. */
  loadMore?: () => Promise<void>;
}>();

/** Key of the open item; `undefined` closes the viewer. */
const selectedKey = defineModel<string | undefined>('selectedKey');

const SWIPE_STEP = 60;
const SWIPE_CLOSE = 120;
const DOUBLE_TAP_MS = 300;
const MAX_SCALE = 4;

const route = useRoute();
const router = useRouter();
const dialog = ref<HTMLElement>();
/** A deep-linked photo that isn't in the loaded list (yet), shown without previous/next. */
const standalone = shallowRef<ArchiveImage>();

const selectedIndex = computed(() => props.items.findIndex(item => item.key === selectedKey.value));
const selectedImage = computed(() => props.items[selectedIndex.value]?.image ?? standalone.value);
const isOpen = computed(() => Boolean(selectedImage.value));
const canStep = computed(() => selectedIndex.value !== -1 && props.items.length > 1);

useFocusTrap(dialog, isOpen);

// --- URL sync: `?foto=<id>` makes photos shareable and lets the back button close the viewer.

/** Whether opening the viewer added a history entry that closing should pop. */
let pushedHistory = false;
/**
 * The page that owns this viewer. KeepAlive keeps the gallery's viewer alive on
 * other pages, so it must ignore `?foto` changes that belong to them.
 */
const ownerPath = route.path;
const isOwnerRoute = () => route.path === ownerPath;

watch(selectedImage, (image, previous) => {
  if (!import.meta.client)
    return;

  document.body.style.overflow = image ? 'hidden' : '';
  resetGesture();
  if (!image || !isOwnerRoute() || route.query.foto === image.id)
    return;

  const query = { ...route.query, foto: image.id };
  if (previous) {
    void router.replace({ query });
  }
  else {
    pushedHistory = true;
    void router.push({ query });
  }
});

watch(() => route.query.foto, (foto) => {
  if (!isOwnerRoute())
    return;
  if (typeof foto !== 'string' || !foto) {
    pushedHistory = false;
    selectedKey.value = undefined;
    standalone.value = undefined;
    return;
  }
  if (selectedImage.value?.id !== foto)
    openById(foto);
});

// A deep-linked photo can show up in the list once more pages load.
watch(() => props.items, (items) => {
  const id = standalone.value?.id;
  const item = id && items.find(entry => entry.image.id === id);
  if (item) {
    selectedKey.value = item.key;
    standalone.value = undefined;
  }
});

onMounted(() => {
  const foto = route.query.foto;
  if (typeof foto === 'string' && foto)
    openById(foto);
});

onBeforeUnmount(() => {
  if (import.meta.client)
    document.body.style.overflow = '';
});

onKeyStroke('Escape', () => {
  if (isOpen.value)
    close();
});
onKeyStroke('ArrowRight', () => void next());
onKeyStroke('ArrowLeft', previous);

function openById(id: string) {
  const item = props.items.find(entry => entry.image.id === id);
  if (item) {
    standalone.value = undefined;
    selectedKey.value = item.key;
    return;
  }

  selectedKey.value = undefined;
  standalone.value = {
    etag: '',
    height: null,
    id,
    name: 'Foto',
    size: 0,
    uploadedAt: '',
    width: null,
  };
}

function close() {
  if (pushedHistory && route.query.foto) {
    // Popping the entry we pushed lets the `foto` watcher close the viewer.
    pushedHistory = false;
    router.back();
    return;
  }

  selectedKey.value = undefined;
  standalone.value = undefined;
  if (route.query.foto) {
    const { foto: _foto, ...query } = route.query;
    void router.replace({ query });
  }
}

async function next() {
  const index = selectedIndex.value;
  if (!isOpen.value || !canStep.value)
    return;

  if (index === props.items.length - 1)
    await props.loadMore?.();
  selectedKey.value = props.items[(index + 1) % props.items.length]?.key;
}

function previous() {
  const index = selectedIndex.value;
  if (!isOpen.value || !canStep.value)
    return;

  selectedKey.value = props.items[(index - 1 + props.items.length) % props.items.length]?.key;
}

// --- Touch gestures: swipe to step or close, pinch / double-tap to zoom, drag to pan.

const scale = ref(1);
const offset = reactive({ x: 0, y: 0 });
const swipe = reactive({ x: 0, y: 0 });
const isDragging = ref(false);
const pointers = new Map<number, { x: number; y: number }>();
let gestureStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };
let pinchStart = { distance: 1, scale: 1 };
let travelled = 0;
let lastTapAt = 0;

const stageStyle = computed(() => ({
  transform: `translate3d(${offset.x + swipe.x}px, ${offset.y + swipe.y}px, 0) scale(${scale.value})`,
  transition: isDragging.value
    ? 'none'
    : 'transform 200ms ease-out',
}));
/** The backdrop fades as the photo is dragged down to close. */
const backdropStyle = computed(() => ({
  backgroundColor: `rgb(0 0 0 / ${0.95 * (1 - Math.min(swipe.y / 400, 0.6))})`,
}));

function resetGesture() {
  scale.value = 1;
  offset.x = 0;
  offset.y = 0;
  swipe.x = 0;
  swipe.y = 0;
  pointers.clear();
  isDragging.value = false;
}

function pinchDistance() {
  const [a, b] = [
    ...pointers.values(),
  ];
  return a && b
    ? Math.hypot(a.x - b.x, a.y - b.y)
    : 1;
}

function onPointerDown(event: PointerEvent) {
  // Mouse users get the arrows and the zoom lens instead.
  if (event.pointerType === 'mouse')
    return;

  try {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  catch {
    // Not every pointer can be captured; tracking still works without it.
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  isDragging.value = true;

  if (pointers.size === 1) {
    gestureStart = { x: event.clientX, y: event.clientY };
    panStart = { x: offset.x, y: offset.y };
    travelled = 0;
  }
  else if (pointers.size === 2) {
    pinchStart = {
      distance: pinchDistance(),
      scale: scale.value,
    };
    swipe.x = 0;
    swipe.y = 0;
  }
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId))
    return;

  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size >= 2) {
    scale.value = Math.min(MAX_SCALE, Math.max(1, pinchStart.scale * pinchDistance() / pinchStart.distance));
    return;
  }

  const dx = event.clientX - gestureStart.x;
  const dy = event.clientY - gestureStart.y;
  travelled = Math.max(travelled, Math.hypot(dx, dy));
  if (scale.value > 1) {
    offset.x = panStart.x + dx;
    offset.y = panStart.y + dy;
  }
  else if (Math.abs(dx) > Math.abs(dy)) {
    swipe.x = dx;
    swipe.y = 0;
  }
  else {
    swipe.x = 0;
    swipe.y = Math.max(0, dy);
  }
}

function onPointerUp(event: PointerEvent, cancelled = false) {
  if (!pointers.delete(event.pointerId))
    return;

  if (pointers.size > 0) {
    // A pinch ended with one finger still down: continue as a pan from here.
    const [remaining] = [
      ...pointers.values(),
    ];
    gestureStart = { ...remaining! };
    panStart = { x: offset.x, y: offset.y };
    return;
  }

  isDragging.value = false;
  const { x: swipeX, y: swipeY } = swipe;
  swipe.x = 0;
  swipe.y = 0;
  if (cancelled)
    return;

  if (scale.value <= 1.02) {
    scale.value = 1;
    offset.x = 0;
    offset.y = 0;
    if (swipeY > SWIPE_CLOSE)
      return close();
    if (swipeX < -SWIPE_STEP)
      return void next();
    if (swipeX > SWIPE_STEP)
      return previous();
  }

  const now = Date.now();
  if (travelled < 10 && now - lastTapAt < DOUBLE_TAP_MS) {
    lastTapAt = 0;
    if (scale.value > 1)
      resetGesture();
    else
      scale.value = 2.5;
    return;
  }
  lastTapAt = now;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="selectedImage"
      ref="dialog"
      class="p-3 flex items-center inset-0 justify-center fixed z-[100] overflow-hidden backdrop-blur-xs md:p-8"
      :style="backdropStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="`Pratinjau ${selectedImage.name}`"
      tabindex="-1"
      @click.self="close"
    >
      <AtomsCloseButton
        class="right-3 top-3 absolute z-20 !text-white md:right-6 md:top-6"
        aria-label="Tutup pratinjau"
        @click="close"
      />
      <!-- Touch screens step with swipes, so the arrows are desktop-only. -->
      <span v-if="canStep" class="hidden left-2 absolute z-20 md:block md:left-6">
        <AtomsArrowButton direction="left" class="!text-white" aria-label="Foto sebelumnya" @click="previous" />
      </span>
      <div
        class="select-none touch-none"
        :style="stageStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp($event, true)"
      >
        <MoleculesZoomLens
          :key="selectedImage.id"
          :src="selectedImage.id"
          :alt="`Pratinjau ${selectedImage.name}`"
        />
      </div>
      <span v-if="canStep" class="hidden right-2 absolute z-20 md:block md:right-6">
        <AtomsArrowButton direction="right" class="!text-white" aria-label="Foto berikutnya" @click="next" />
      </span>
    </div>
  </Teleport>
</template>
