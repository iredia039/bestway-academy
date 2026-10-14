import "./globals.css";

export const metadata = {
  title: "Bestway Online Academy",
  description:
    "A free 30-minute live session with a tutor, then a one-page Snapshot showing where your child stands. UK curriculum, Years 1 to 13.",
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
      <body className="bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
