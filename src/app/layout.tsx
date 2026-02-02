import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trak Racer Support | AI Assistant",
  description: "Get expert help with Trak Racer sim racing rigs. Check compatibility, track orders, troubleshoot assembly, and find the perfect rig for your setup.",
  keywords: ["sim racing", "Trak Racer", "racing simulator", "TR80", "TR120", "TR160", "TR8 Pro", "Alpine F1"],
  openGraph: {
    title: "Trak Racer AI Support Assistant",
    description: "Expert help with sim racing rigs, compatibility, orders, and assembly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
