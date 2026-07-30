interface ThemeViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ThemeViewTransition;
};

const FALLBACK_DURATION = 700;
const REVEAL_DURATION = 1_200;

export function useAnimatedColorMode() {
  const colorMode = useColorMode();
  const isTransitioning = useState('ensik-color-mode-transitioning', () => false);
  const isDarkMode = computed(() => colorMode.value === 'dark');

  async function toggleColorMode(event?: MouseEvent) {
    if (isTransitioning.value)
      return;

    const nextMode = isDarkMode.value ? 'light' : 'dark';
    if (!import.meta.client) {
      colorMode.preference = nextMode;
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transitionDocument = document as TransitionDocument;
    const startViewTransition = transitionDocument.startViewTransition?.bind(document);

    if (reduceMotion) {
      colorMode.preference = nextMode;
      return;
    }

    isTransitioning.value = true;
    const root = document.documentElement;

    try {
      if (!startViewTransition) {
        root.dataset.colorModeTransition = 'fallback';
        await nextAnimationFrame();
        colorMode.preference = nextMode;
        await delay(FALLBACK_DURATION);
        return;
      }

      const { x, y } = getTransitionOrigin(event);
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      root.style.setProperty(
        '--ensik-color-mode-clip',
        `circle(0 at ${x}px ${y}px)`,
      );
      root.dataset.colorModeTransition = 'reveal';
      await nextAnimationFrame();

      const transition = startViewTransition(async () => {
        colorMode.preference = nextMode;
        await nextTick();
      });

      await transition.ready;
      const reveal = root.animate(
        {
          clipPath: [
            `circle(0 at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: REVEAL_DURATION,
          easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)',
        },
      );

      await Promise.allSettled([reveal.finished, transition.finished]);
    }
    finally {
      root.style.removeProperty('--ensik-color-mode-clip');
      delete root.dataset.colorModeTransition;
      isTransitioning.value = false;
    }
  }

  return {
    isDarkMode,
    isTransitioning: readonly(isTransitioning),
    toggleColorMode,
  };
}

function getTransitionOrigin(event?: MouseEvent) {
  const target = event?.currentTarget;
  if (target instanceof HTMLElement) {
    const bounds = target.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

function nextAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function delay(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
