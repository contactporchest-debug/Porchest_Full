import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/context/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: 'Porchest - Influencer & Brand Collaboration Platform',
    description: 'Connect brands with influencers through smart matching, structured workflows, and clear analytics.',
    keywords: 'influencer marketing, brand collaboration, creator discovery, influencer platform',
    icons: {
        icon: '/logo.png',
        apple: '/apple-icon.png',
        shortcut: '/favicon.ico',
    },
    openGraph: {
        title: 'Porchest',
        description: 'Smart influencer and brand collaboration in one clear workspace.',
        type: 'website',
        images: [{ url: '/porchest-logo.png', width: 1200, height: 630 }],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" type="image/png" href="/logo.png" />
                <link rel="apple-touch-icon" href="/apple-icon.png" />
            </head>
            <body className="bg-[#0A0A0B] text-white antialiased">
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                <AuthProvider>
                    <SocketProvider>
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: '#1A1A1E',
                                    color: '#FFFFFF',
                                    border: '1px solid #2A2A30',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    boxShadow: '0 18px 42px rgba(0,0,0,0.30)',
                                },
                                success: {
                                    iconTheme: { primary: '#10B981', secondary: '#fff' },
                                },
                                error: {
                                    iconTheme: { primary: '#ff3c3c', secondary: '#fffdf8' },
                                },
                            }}
                        />
                    </SocketProvider>
                </AuthProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
