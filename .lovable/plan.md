

# Picture-in-Picture Floating Timer

## Overview
Add a "Float Timer" button to the dashboard that opens the cooldown timer in a Document Picture-in-Picture window, allowing users to keep track of their study cooldown even when switching tabs.

## Implementation

### 1. New Hook: `src/hooks/usePictureInPicture.tsx`
A custom React hook that encapsulates all PiP logic:
- Check for `documentPictureInPicture` API support in the browser
- Open a small PiP window (width: 300, height: 180)
- Clone stylesheets into the PiP window for consistent theming
- Use `createPortal` to render React content into the PiP document
- Clean up on unmount or when the PiP window is closed
- Expose `isSupported`, `isOpen`, `toggle`, and `pipContainer` (portal target)

### 2. New Component: `src/components/PipTimerContent.tsx`
A standalone timer display designed for the small PiP window:
- Large, centered countdown text using Noto Serif JP
- Circular progress indicator (reusing the SVG pattern from FloatingTimer)
- When cooldown reaches 0, displays "Ready to log next hour" in sakura pink
- Inline styles referencing the same CSS custom properties for theme consistency
- Minimal layout optimized for a ~300x180 viewport

### 3. Dashboard Changes (`src/pages/Dashboard.tsx`)
- Import the new hook and PiP component
- Add a "Float Timer" button (using the `PictureInPicture` lucide icon) next to the cooldown area
- The button only appears when:
  - A cooldown is active (cooldown > 0)
  - The browser supports Document PiP
- When PiP is open, the button label changes to "Close Float"
- Render `PipTimerContent` via portal into the PiP window

### 4. Browser Compatibility
- The Document Picture-in-Picture API is currently supported in Chromium-based browsers (Chrome 116+, Edge 116+)
- If unsupported, the "Float Timer" button simply won't render -- no errors or broken UI
- TypeScript types for `documentPictureInPicture` will be declared inline since it's not yet in standard lib types

## Technical Details

```text
Dashboard
  +-- cooldown > 0?
  |     +-- "Float Timer" button (if PiP supported)
  |     +-- Click -> opens PiP window (300x180)
  |           +-- Copies <link> stylesheets into PiP <head>
  |           +-- Renders PipTimerContent via createPortal
  |           +-- Updates every second (React state-driven)
  +-- FloatingTimer (existing, unchanged)
```

### Files to Create
- `src/hooks/usePictureInPicture.tsx` -- PiP lifecycle hook
- `src/components/PipTimerContent.tsx` -- Timer UI for PiP window

### Files to Modify
- `src/pages/Dashboard.tsx` -- Add Float Timer button and PiP integration

No database changes or new dependencies required.
