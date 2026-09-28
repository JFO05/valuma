import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeImpressaoClara } from "@/components/theme-impressao-clara";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ValuM&A",
  description: "Valuation e M&A para pequenas e médias empresas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Aplica a classe `dark` antes da primeira pintura, lendo a mesma
            chave de localStorage que components/ui/theme-toggle.tsx usa —
            sem isso, a página sempre abriria no tema claro por um instante
            antes do React hidratar e corrigir, mesmo com tema escuro salvo. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tema");var escuro=t==="escuro"||(t!=="claro"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",escuro);}catch(e){}})();`,
          }}
        />
        <ThemeImpressaoClara />
        {children}
      </body>
    </html>
  );
}
