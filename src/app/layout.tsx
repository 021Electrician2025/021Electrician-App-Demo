import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "021 Electrician Application",
  description: "Comprehensive hotel facilities management system for maintenance, work orders, and asset tracking.",
  keywords: ["Hotel", "Facilities", "Management", "Maintenance", "Work Orders", "Assets"],
  authors: [{ name: "Hotel Facilities Management Team" }],
  icons: {
    icon: "/Logo.jpeg",
    shortcut: "/Logo.jpeg",
    apple: "/Logo.jpeg",
  },
  openGraph: {
    title: "021 Electrician Application",
    description: "Comprehensive electrician application system",
    siteName: "021 Electrician Application",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "021 Electrician Application",
    description: "Comprehensive electrician application system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Logo.jpeg" type="image/jpeg" />
        <link rel="shortcut icon" href="/Logo.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/Logo.jpeg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
