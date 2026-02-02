import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cat Runner - Paradise & Hell",
  description: "A 2D platformer where a cat runs through paradise and demonic worlds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
