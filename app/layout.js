import Script from "next/script";
import "./globals.css";
import { ANALYTICS_WEBSITE_ID } from "./analytics";

export const metadata = {
  title: "Bestway Online Academy",
  description:
    "A free live assessment with an expert tutor, so you know exactly where your child stands. UK, US, Canada and international school systems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" className="scroll-smooth scroll-pt-20">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white font-sans text-ink antialiased">{children}
        {ANALYTICS_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={ANALYTICS_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
