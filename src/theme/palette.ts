// Enterprise Design System - Color Palette
// Inspired by Linear, Vercel, Stripe Dashboard aesthetics

export const palette = {
  primary: { 
    main: '#0F172A', 
    light: '#334155', 
    dark: '#020617',
    contrastText: '#FFFFFF',
  },
  secondary: { 
    main: '#6366F1', 
    light: '#818CF8', 
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  success: { 
    main: '#10B981', 
    light: '#D1FAE5', 
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  warning: { 
    main: '#F59E0B', 
    light: '#FEF3C7', 
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: { 
    main: '#EF4444', 
    light: '#FEE2E2', 
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',
    light: '#DBEAFE',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  background: { 
    default: '#F8FAFC', 
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    disabled: '#94A3B8',
  },
  divider: '#E2E8F0',
};

// Extended semantic tokens for enterprise UI
export const tokens = {
  // Surface hierarchy
  surface: {
    ground: '#F8FAFC',
    raised: '#FFFFFF',
    overlay: '#FFFFFF',
    sunken: '#F1F5F9',
  },
  // Sidebar specific
  sidebar: {
    bg: '#0F172A',
    bgHover: '#1E293B',
    bgActive: '#1E293B',
    text: '#94A3B8',
    textActive: '#FFFFFF',
    border: '#1E293B',
    accent: '#6366F1',
  },
  // Metric card colors
  metrics: {
    blue: { bg: '#EFF6FF', icon: '#3B82F6', text: '#1E40AF' },
    green: { bg: '#ECFDF5', icon: '#10B981', text: '#065F46' },
    purple: { bg: '#F5F3FF', icon: '#8B5CF6', text: '#5B21B6' },
    amber: { bg: '#FFFBEB', icon: '#F59E0B', text: '#92400E' },
    red: { bg: '#FEF2F2', icon: '#EF4444', text: '#991B1B' },
    indigo: { bg: '#EEF2FF', icon: '#6366F1', text: '#3730A3' },
    teal: { bg: '#F0FDFA', icon: '#14B8A6', text: '#115E59' },
    rose: { bg: '#FFF1F2', icon: '#F43F5E', text: '#9F1239' },
  },
  // Chart colors
  chart: {
    primary: '#6366F1',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#EF4444',
    quinary: '#8B5CF6',
  },
};
