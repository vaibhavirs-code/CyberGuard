
import type { Metadata } from 'next';
import { Inter, Source_Code_Pro, Space_Grotesk } from "next/font/google";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AnimatedBackground } from '@/components/dashboard/animated-background';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-code",
});

export const metadata: Metadata = {
  title: 'CyberGuard Vision | AI Retail Intelligence',
  description: 'Next-generation AI-powered retail anti-theft and automated payment verification system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })()
          `
        }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable} font-body antialiased bg-background text-foreground overflow-hidden`}>
        <AnimatedBackground />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
