import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/AuthProvider";
import { PageTracker } from "@/components/PageTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://resumeforge.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ResumeForge — Free AI Resume & CV Generator | ATS-Friendly",
    template: "%s | ResumeForge",
  },
  description:
    "Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes. No experience needed.",
  keywords: [
    "generate cv using ai free",
    "generate resume using ai free",
    "generate resume cv ats friendly using ai free",
    "ai resume generator free",
    "ai cv generator free",
    "ats friendly resume generator",
    "ats resume builder free",
    "resume builder ai",
    "cv builder ai free",
    "free resume maker ai",
    "buat cv pakai ai gratis",
    "generator cv ats gratis",
  ],
  authors: [{ name: "ResumeForge" }],
  creator: "ResumeForge",
  publisher: "ResumeForge",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "ResumeForge",
    title: "ResumeForge — Free AI Resume & CV Generator | ATS-Friendly",
    description:
      "Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ResumeForge — Free AI Resume & CV Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeForge — Free AI Resume & CV Generator | ATS-Friendly",
    description:
      "Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes.",
    images: ["/og-image.png"],
    creator: "@resumeforge",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans antialiased", inter.variable)}>
      <body className="min-h-screen">
        <div className="gradient-mesh" />
        <PageTracker />
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

