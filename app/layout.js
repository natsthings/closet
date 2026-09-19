import "./globals.css";

export const metadata = {
  title: "closet.exe — your virtual wardrobe",
  description: "A vintage-web virtual closet: track what you own, want, and see.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-dots" />
        {children}
      </body>
    </html>
  );
}
