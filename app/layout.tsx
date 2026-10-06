import "./globals.css";

export const metadata = {
  title: "Neo 1",
  description: "Neo 1 — AI powered by @Neel Madanlal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
