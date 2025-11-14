import { createStitches } from '@stitches/react';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      // Background colors
      bg: '#ffffff',
      bgSecondary: '#f8f9fa',
      bgTertiary: '#e9ecef',
      
      // Text colors
      text: '#212529',
      textSecondary: '#6c757d',
      textMuted: '#adb5bd',
      
      // Brand colors
      primary: '#0066ff',
      primaryHover: '#0052cc',
      primaryLight: '#e6f2ff',
      
      // Status colors
      success: '#28a745',
      successLight: '#d4edda',
      error: '#dc3545',
      errorLight: '#f8d7da',
      warning: '#ffc107',
      warningLight: '#fff3cd',
      
      // UI colors
      border: '#dee2e6',
      borderLight: '#e9ecef',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowHover: 'rgba(0, 0, 0, 0.15)',
      
      // Message colors
      userMessage: '#0066ff',
      assistantMessage: '#f8f9fa',
      userText: '#ffffff',
      assistantText: '#212529',
      
      // Gray colors for light mode
      gray50: '#f8f9fa',
      gray100: '#e9ecef',
      gray200: '#dee2e6',
      gray300: '#ced4da',
    },
    space: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
    },
    fontSizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fonts: {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      base: 1.5,
      relaxed: 1.75,
    },
    radii: {
      sm: '4px',
      base: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    transitions: {
      fast: '150ms ease-in-out',
      base: '200ms ease-in-out',
      slow: '300ms ease-in-out',
    },
  },
  media: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
  },
  utils: {
    // Padding
    p: (value: string | number) => ({
      padding: value,
    }),
    pt: (value: string | number) => ({
      paddingTop: value,
    }),
    pr: (value: string | number) => ({
      paddingRight: value,
    }),
    pb: (value: string | number) => ({
      paddingBottom: value,
    }),
    pl: (value: string | number) => ({
      paddingLeft: value,
    }),
    px: (value: string | number) => ({
      paddingLeft: value,
      paddingRight: value,
    }),
    py: (value: string | number) => ({
      paddingTop: value,
      paddingBottom: value,
    }),
    
    // Margin
    m: (value: string | number) => ({
      margin: value,
    }),
    mt: (value: string | number) => ({
      marginTop: value,
    }),
    mr: (value: string | number) => ({
      marginRight: value,
    }),
    mb: (value: string | number) => ({
      marginBottom: value,
    }),
    ml: (value: string | number) => ({
      marginLeft: value,
    }),
    mx: (value: string | number) => ({
      marginLeft: value,
      marginRight: value,
    }),
    my: (value: string | number) => ({
      marginTop: value,
      marginBottom: value,
    }),
  },
});

// Dark theme
export const darkTheme = createTheme({
  colors: {
    // Background colors
    bg: '#1a1a1a',
    bgSecondary: '#242424',
    bgTertiary: '#2d2d2d',
    
    // Text colors
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    textMuted: '#707070',
    
    // Brand colors
    primary: '#4a9eff',
    primaryHover: '#6bb0ff',
    primaryLight: '#1a3a5c',
    
    // Status colors
    success: '#4ade80',
    successLight: '#1a3a2a',
    error: '#f87171',
    errorLight: '#3a1a1a',
    warning: '#fbbf24',
    warningLight: '#3a2a1a',
    
    // UI colors
    border: '#3a3a3a',
    borderLight: '#2d2d2d',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowHover: 'rgba(0, 0, 0, 0.4)',
    
    // Message colors
    userMessage: '#4a9eff',
    assistantMessage: '#2d2d2d',
    userText: '#ffffff',
    assistantText: '#e0e0e0',
    
    // Gray colors for dark mode
    gray50: '#2d2d2d',
    gray100: '#3a3a3a',
    gray200: '#4a4a4a',
    gray300: '#5a5a5a',
  },
});

export const globalStyles = globalCss({
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  
  'html, body': {
    height: '100%',
    width: '100%',
    overflow: 'hidden', // Prevent page scrolling
  },
  
  '#root': {
    height: '100%',
    width: '100%',
  },
  
  body: {
    fontFamily: '$system',
    fontSize: '$base',
    lineHeight: '$base',
    color: '$text',
    backgroundColor: '$bgSecondary',
    '-webkit-font-smoothing': 'antialiased',
    '-moz-osx-font-smoothing': 'grayscale',
    transition: 'background-color $base, color $base',
  },
  
  'button, input, textarea': {
    fontFamily: 'inherit',
  },
});

