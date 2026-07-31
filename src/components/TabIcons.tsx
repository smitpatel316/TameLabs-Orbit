import React from 'react';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { theme } from '../theme';

type IconProps = { focused: boolean; size?: number };

export function ContactsIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Orbit rings around core */}
      <Circle cx="12" cy="12" r="2.2" fill={color} />
      <Circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth={focused ? 0 : 1.4} fill="none" opacity={focused ? 0.7 : 0.5} />
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={focused ? 0 : 1.2} fill="none" opacity={0.35} />
    </Svg>
  );
}

export function InsightsIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Minimal bar chart */}
      <Rect x="3" y="14" width="3" height="6" rx="1" fill={color} opacity={focused ? 1 : 0.4} />
      <Rect x="8.5" y="10" width="3" height="10" rx="1" fill={color} opacity={focused ? 1 : 0.65} />
      <Rect x="14" y="6" width="3" height="14" rx="1" fill={color} opacity={1} />
    </Svg>
  );
}

export function MapIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Minimal map pin with rings */}
      <Path d="M12 2a7 7 0 00-7 7c0 5 7 11.5 7 11.5S19 15 19 9a7 7 0 00-7-7z" stroke={color} strokeWidth={focused ? 0 : 1.5} fill={focused ? color : 'none'} />
      <Circle cx="12" cy="9" r="2.2" fill={focused ? theme.colors.background : color} />
    </Svg>
  );
}

export function RemindersIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bell */}
      <Path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2z" stroke={color} strokeWidth={focused ? 0 : 1.5} fill={focused ? color : 'none'} strokeLinejoin="round" />
      <Path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ focused, size = 22 }: IconProps) {
  const color = focused ? theme.colors.onPrimary : theme.colors.textTertiary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={focused ? 0 : 1.5} fill={focused ? color : 'none'} />
      <Path d="M12 2v2.5M12 19.5V22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2 12h2.5M19.5 12H22M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}
