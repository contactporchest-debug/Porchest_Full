import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: 'Porchest – AI-Powered Influencer & Brand Platform',
    description: 'Connect brands with influencers through AI-powered matching, real-time messaging, and analytics.',
    keywords: 'influencer marketing, brand collaboration, AI matching, influencer platform',
    openGraph: {
        title: 'Porchest',
        description: 'AI-Powered Multi-Portal Influencer & Brand Management',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#0d0118',
                                color: '#fff',
                                border: '1px solid rgba(123,47,247,0.3)',
                                borderRadius: '12px',
                                fontSize: '14px',
                            },
                            success: {
                                iconTheme: { primary: '#7B2FF7', secondary: '#fff' },
                            },
                            error: {
                                iconTheme: { primary: '#ff3c3c', secondary: '#fff' },
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
