import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Kvastram Wholesale | B2B Partnership",
    description: "Partner with Kvastram for wholesale and bulk orders. Exclusive pricing for retailers and distributors worldwide.",
};

export default function WholesaleLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} antialiased bg-white text-stone-900`}
            >
                {children}
            </body>
        </html>
    );
}
