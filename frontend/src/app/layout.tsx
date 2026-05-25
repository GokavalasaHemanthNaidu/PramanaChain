import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PramanaChain | AI-Powered Cryptographic Verification Ledger",
  description: "PramanaChain is the ultimate forensic document verification platform. Securely anchor documents to an immutable cryptographic ledger using zero-shot AI, ECDSA signatures, and deepfake detection.",
  keywords: ["PramanaChain", "pramanachain", "cryptographic ledger", "AI verification", "deepfake detection", "document authentication", "ECDSA signatures"],
  authors: [{ name: "Hemanth Naidu" }],
  openGraph: {
    title: "PramanaChain | Cryptographic Ledger",
    description: "Verify and anchor documents using AI and cryptography.",
    url: "https://pramanachain.vercel.app",
    siteName: "PramanaChain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
