
import { Montserrat } from "next/font/google";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} dark h-full antialiased`}
    >
      <body
        className={`${montserrat.className} min-h-dvh bg-background font-sans text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
