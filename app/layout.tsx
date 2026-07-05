import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "MINLAB 3D";

export const metadata: Metadata = {
  title: appName,
  description: "Учёт пластика, расчёт себестоимости и CRM для студий 3D-печати",
  icons: { icon: "/icon.png" },
  openGraph: {
    title: appName,
    description:
      "Учёт пластика, расчёт себестоимости и CRM для студий 3D-печати",
    images: [{ url: "/icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn("font-sans dark", geist.variable)}>
      <body className="antialiased bg-industrial">
        <BridgeProvider />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
