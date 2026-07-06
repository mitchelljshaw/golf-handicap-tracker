import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Des Golf Tracker",
  description: "Tracking my golf rounds and handicap index.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
