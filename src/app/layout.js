import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Brogence — Partner Application | Pramerica Life Insurance",
  description: "Apply to join the elite financial advisory team at Pramerica Life Insurance through the Brogence Partner Program. Showcase your sales skills and industry knowledge.",
  keywords: "Pramerica, life insurance, financial advisor, sales, Brogence, career",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-950">
        {children}
      </body>
    </html>
  );
}
