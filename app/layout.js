import { Inter, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata = {
  title: "Eva & Leo's NYC 2026 Trip",
  description: "6-day NYC trip planner — bookstores, vegan food & museums",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem('theme');if(d==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} ${caveat.variable} antialiased`}>{children}</body>
    </html>
  );
}
