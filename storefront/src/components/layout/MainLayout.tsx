
'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WholesaleHeader } from "@/components/layout/WholesaleHeader";
import { WholesaleFooter } from "@/components/layout/WholesaleFooter";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isWholesalePage = pathname?.startsWith('/wholesale');

    return (
        <>
            {isWholesalePage ? <WholesaleHeader /> : <Header />}
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
            {isWholesalePage ? <WholesaleFooter /> : <Footer />}
        </>
    );
}
