export const theme = {
    colors: {
        background: '#0F0F10',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        border: '#2C2C2E',
        primary: '#E53E3E',
        onPrimary: '#FFFFFF',
        danger: '#FF3B30',
        success: '#34C759',
        error: '#FF3B30',
        warning: '#FF9500',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 4,
        m: 8,
        l: 12,
        full: 9999,
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: '700' as const,
            letterSpacing: -1,
        },
        h2: {
            fontSize: 24,
            fontWeight: '600' as const,
            letterSpacing: -0.5,
        },
        h3: {
            fontSize: 18,
            fontWeight: '600' as const,
            letterSpacing: -0.3,
        },
        body: {
            fontSize: 16,
            lineHeight: 24,
        },
        small: {
            fontSize: 14,
            lineHeight: 20,
        },
        mono: {
            fontFamily: 'Courier',
            fontSize: 14,
        },
    },
};
