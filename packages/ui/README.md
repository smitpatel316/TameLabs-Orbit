# @tamelabs/ui

Shared UI components for TameLabs. Imports @tamelabs/theme for tokens.

Components:
- Button variant primary|secondary|ghost|danger size s/m/l loading disabled a11y
- Input label/error/hint focused/error border placeholderTextColor textTertiary
- EmptyState icon/title/subtitle/action secondary button
- Loading + SkeletonCard
- ErrorView title/message/onRetry
- TabIcons: FeedIcon CirclesIcon YouIcon SettingsIcon (svg, focused bool)

Usage in apps (via file: package):

In app package.json:
  "@tamelabs/theme": "file:../../packages/theme",
  "@tamelabs/ui": "file:../../packages/ui"

In src/theme.ts wrapper:
  export * from '@tamelabs/theme';

In src/components/Button.tsx wrapper:
  export { Button } from '@tamelabs/ui';

Or directly:
  import { Button, theme } from '@tamelabs/ui';

Apps keep thin wrappers for tsc + Expo Metro compatibility.

Future: migrate all screens to import from @tamelabs/ui barrel when Metro extraNodeModules configured.
