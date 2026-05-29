import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillValut X — AI Learning Operating System",
  description: "Futuristic interactive developer environment workspace mapping custom learning roadmaps using generative AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-[#030712] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
