import type { Metadata } from "next";
import { Noto_Sans_Ethiopic, Noto_Serif_Ethiopic, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const ethiopicSans = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic-sans",
});

const ethiopicSerif = Noto_Serif_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic-serif",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "Orracon cash receipts",
  description: "Issue, print, and claim Orracon Construction Plc cash-receipt tickets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="am"
      className={`${ethiopicSans.variable} ${ethiopicSerif.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
