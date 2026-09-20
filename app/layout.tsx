import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minute Zero — A reset for right now",
  description: "Turn a 20-second check-in into a guided wellness reset that fits the moment.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
