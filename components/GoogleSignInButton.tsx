'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Minimal typing for the Google Identity Services script (accounts.google.com/gsi/client)
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        ux_mode?: 'popup' | 'redirect';
                        auto_select?: boolean;
                    }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
                };
            };
        };
    }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleSignInButtonProps {
    onCredential: (credential: string) => void;
}

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const callbackRef = useRef(onCredential);
    const [scriptLoaded, setScriptLoaded] = useState(
        typeof window !== 'undefined' && !!window.google?.accounts
    );

    // Always call the latest handler (it reads the current "remember me" choice)
    callbackRef.current = onCredential;

    useEffect(() => {
        if (!CLIENT_ID || !scriptLoaded || !window.google || !containerRef.current) return;

        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => callbackRef.current(response.credential),
            ux_mode: 'popup',
            auto_select: false,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            locale: 'fr',
            width: containerRef.current.offsetWidth || 320,
        });
    }, [scriptLoaded]);

    if (!CLIENT_ID) return null;

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
        </>
    );
}
