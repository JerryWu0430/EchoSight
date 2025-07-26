import type { Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/context";
import { Header } from "@/components/header";
import { MeshGradientComponent } from "@/components/mesh-gradient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
});

export const dynamic = "force-static";

export const viewport: Viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// Static settings for the app
const staticSettings = {
  defaultTheme: "system" as const,
  forcedTheme: null,
  background: {
    color1: { hex: "#e6f3ff" },
    color2: { hex: "#cce7ff" },
    color3: { hex: "#a6d5ff" },
    color4: { hex: "#80c4ff" },
    speed: 1.5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} antialiased max-w-screen min-h-svh bg-slate-1 text-slate-12 opacity-0 duration-75 transition-opacity`}
      >
        <Providers
          defaultTheme={staticSettings.defaultTheme}
          forcedTheme={staticSettings.forcedTheme}
        >
          <MeshGradientComponent
            colors={[
              staticSettings.background.color1.hex,
              staticSettings.background.color2.hex,
              staticSettings.background.color3.hex,
              staticSettings.background.color4.hex,
            ]}
            speed={staticSettings.background.speed}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 0,
              width: "100%",
              height: "100%",
            }}
          />
          <div className="max-w-screen-sm mx-auto w-full relative z-[1] flex flex-col min-h-screen">
            <div className="px-5 gap-8 flex flex-col flex-1 py-[12vh]">
              <Header />
              <main className="flex justify-center">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
