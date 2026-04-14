export const Colors = {
  // Brand Colors (Vibrant Purple)
  primary: '#6366F1', // Indigo/Purple mix for more professional look
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: 'rgba(99, 102, 241, 0.08)',
  
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  
  // Neutrals (Slate Palette)
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  border: '#E2E8F0', // Slate 200
  
  // States
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  online: '#22C55E',
  
  // Accent Genders/Styles
  black: '#020617',
  white: '#FFFFFF',
  
  // Premium Effects
  gradientPrimary: ['#6366F1', '#4F46E5'],
  glass: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(15, 23, 42, 0.05)',
};

export const Shadows = {
  // Ultra-soft professional shadows
  premium: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  header: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};
