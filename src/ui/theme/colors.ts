const palette = {
  // Keep original colors for backward compatibility
  white: '#ffffff',
  white_muted: 'rgba(255, 255, 255, 0.6)',
  blue: '#512da8',
  blue_light: '#9575cd',
  blue_dark: '#311b92',
  red: '#ED334B',
  red_light: '#f05266',
  red_dark: '#c92b40',
  green: '#39ff14',
  green_light: '#57ff3f',
  green_dark: '#2f770f',
  yellow: '#fcd226',
  yellow_light: '#fff700',
  yellow_dark: '#d5ac00',
  orange: '#FF7B21',
  orange_light: '#ff8f42',
  orange_dark: '#d9691c',

  // New pirate theme colors
  black: '#1C1917',
  black_muted: 'rgba(28, 25, 23, 0.5)',
  black_muted2: 'rgba(28, 25, 23, 0.2)',
  dark: '#2C2724',
  grey: '#44403C',
  light: '#A8A29E',
  black_dark: '#0C0A09',
  gold: '#FFD700',
  gold_light: '#FDE68A',
  gold_dark: '#976D00',
};

export const colors = Object.assign({}, palette, {
  // Keep original mappings
  transparent: 'rgba(0, 0, 0, 0)',
  text: palette.white,
  textDim: palette.white_muted,
  error: palette.red,
  danger: palette.red_dark,
  warning: palette.yellow,
  
  // Update theme colors
  background: palette.black,
  card: palette.black_dark,
  primary: palette.gold,
  bg2: palette.dark,
  bg3: palette.grey,
  bg4: palette.black_muted,
  bg5: palette.black_dark,
  border: 'rgba(255, 215, 0, 0.1)',
  icon_blue: palette.gold,

  // Keep all original color references to maintain compatibility
  blues: palette.blue,
  blues_light: palette.blue_light,
  blues_dark: palette.blue_dark,
});

export type ColorTypes = keyof typeof colors;
