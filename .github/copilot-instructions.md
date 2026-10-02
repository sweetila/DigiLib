# DigiLib: Copilot instructions

DigiLib is an immersive student study-room web app. Client-only, no backend, web desktop/laptop first (mobile later).

## Stack
Vite, React 18, TypeScript (strict), Tailwind CSS v3, Zustand, Zod, lucide-react, Vitest.

## Architecture rules
- Small focused components; no file over ~250 lines. No giant components.
- UI state (active panel, focus mode, modals) lives in `useUIStore` and is NOT persisted.
- Persistent state lives in separate Zustand stores, each with `schemaVersion` and a `migrate` function.
- Never read localStorage during render outside a store. Everything is client-only.
- Never use dangerouslySetInnerHTML. Treat all pasted URLs as untrusted and validate them.
- Respect `prefers-reduced-motion`. Every control needs an aria-label and a visible focus state.
- Use design tokens from tailwind.config. Radii 12-18px. Panels use the `glass` utility.
- Every pure function in `src/lib` gets a Vitest test.

## Timer rules
- Use timestamps (`endTime - Date.now()`), never a decrementing counter.
- Only the clock component may subscribe to ticks. Ticks must not re-render the app shell.
- Log ALL focus time, including partial sessions (stopped early) and overtime (continuing past zero). Store `plannedSec` and `actualSec`; paused time is excluded.
- A streak day requires at least 10 focused minutes in the local timezone.

## Audio rules
- No audio files. Synthesize everything with the Web Audio API: white/pink/brown noise, rain, wind, ocean, a café murmur, and binaural delta/theta waves.
- Delta/Theta need a "Best with headphones" hint. Never claim cognitive or medical benefits.
- Visual background and audio source are fully independent systems.

## Background rules
- The core feature is a playable YouTube video as the fullscreen background, using the official YouTube IFrame Player API only. Never download or extract content.
- Uploaded images are stored as Blobs in IndexedDB; only the ID is stored in settings.

## Data model notes
- Task: `id, title, priority, dueTime?, subjectId?, done, order, estimatedPomos, completedPomos`
- Session log entry: `id, startedAt, plannedSec, actualSec, completed, subjectId?, taskId?, soundscapeName?`
- Scenes reference uploaded images by ID; handle missing images gracefully.