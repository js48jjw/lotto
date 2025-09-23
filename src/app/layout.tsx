import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucky Ball",
  description: "Lucky Guy!!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Left fixed banner (visible only on screens >= 1100px) */}
        <a
          href="https://pmioham9d3.sens.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden min-[1100px]:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 w-[160px]"
        >
          <img
            src="/dbsense-banner-left.png"
            alt="DBSense Left Banner"
            className="block w-full h-auto"
          />
        </a>

        {/* Right fixed banner (visible only on screens >= 1100px) */}
        <a
          href="https://ig8rt9xz3i.sens.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden min-[1100px]:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]"
        >
          <img
            src="/dbsense-banner-right.png"
            alt="DBSense Right Banner"
            className="block w-full h-auto"
          />
        </a>
      </body>
    </html>
  );
}
