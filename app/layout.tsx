import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 商业 IP 编导",
  description: "使用 AI 为您定制专访选题和短视频策划",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
