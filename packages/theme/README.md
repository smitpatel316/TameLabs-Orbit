# @tamelabs/theme

Shared design system for TameLabs.

Canonical source after parity unification 9eb6f67/16146f71/d0779eb + warning tokens 65e03955.

## Tokens

- HEALTH_PALETTE: excellent good okay poor critical
- GROUP_COLORS: 8 palette
- MONTHS: January-December static array for ISO grouping (no toLocaleDateString in screens)
- theme.colors: background/surface/surfaceLight/surfaceMuted/surfaceHover/surfaceActive/border/borderLight/borderStrong/text/textSecondary/textTertiary/textMuted/primary/onPrimary/primaryHover/danger/dangerBg/dangerBorder/dangerText/success/successBg/warning/warningBg/warningBorder/warningText/error/accent/tagBg/tagText/circleBadgeBg/circleBadgeText/focus/skeleton/skeletonHighlight/overlay/health
- theme.health === theme.colors.health (dual alias for tsc parity)
- spacing xs/s/m/ml/l/xl/xxl/xxxl
- borderRadius xs/s/m/ml/l/xl/xxl/pill/full
- typography display/h1/h2/h3/body/bodySmall/caption/micro/label/labelSmall/mono
- shadows none/sm/md/lg/card/cardHover/chip/fab/modal
- sizes fab/avatar/iconSmall/iconMedium/iconLarge/tabBar
- RELATIONSHIP_COLORS family/friend/professional/romantic/acquaintance
- helpers getHealthColor(h), getHubbleTierColor(tier), getHubbleTierLabel(brier,resolved), formatTimeAgo, formatDate, formatFullDate, MONTHS, GROUP_COLORS

All apps import via thin wrapper src/theme.ts that re-exports from @tamelabs/theme (file:../../packages/theme). Keeps Expo export working with docker builder npm install file: link.

Usage:
import { theme, HEALTH_PALETTE, GROUP_COLORS, MONTHS, formatTimeAgo } from '../theme';
