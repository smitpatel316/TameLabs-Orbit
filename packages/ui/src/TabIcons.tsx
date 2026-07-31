import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { theme } from '@tamelabs/theme';

type IconProps = { focused: boolean; size?: number };

export function FeedIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Minimal speech / leaf shape for Quiet feed - open circle with dot */}
      <Path
        d={focused ? "M12 2C6.48 2 2 6.24 2 12c0 3.2 1.4 6.06 3.6 8.12L5 22l2.2-1.2C8.92 21.68 10.4 22 12 22c5.52 0 10-4.24 10-10S17.52 2 12 2z M12 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" : "M12 2C6.5 2 2 6.2 2 11.5c0 2.7 1.2 5.1 3.1 6.9l-.7 3 3-1.6c1.3.7 2.8 1.1 4.6 1.1 5.5 0 10-4.2 10-9.4S17.5 2 12 2z"}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={focused ? 0 : 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CirclesIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Two overlapping circles for Circles */}
      <Circle cx="9" cy="12" r="5.5" stroke={color} strokeWidth={focused ? 0 : 1.6} fill={focused ? color : 'none'} opacity={focused ? 1 : 0.9} />
      <Circle cx="15" cy="12" r="5.5" stroke={color} strokeWidth={focused ? 0 : 1.6} fill={focused ? color : 'none'} opacity={focused ? 0.8 : 0.5} />
    </Svg>
  );
}

export function YouIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={focused ? 0 : 1.6} fill={focused ? color : 'none'} />
      <Path d="M5.5 19c0-3.5 2.8-5.5 6.5-5.5S18.5 15.5 18.5 19" stroke={color} strokeWidth={focused ? 0 : 1.6} fill={focused ? color : 'none'} strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={focused ? 0 : 1.6} fill={focused ? color : 'none'} />
      <Path
        d="M12 2v2.5M12 19.5V22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2 12h2.5M19.5 12H22M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
