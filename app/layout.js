import "./globals.css";

export const metadata = {
  title: "Game Debt Tracker",
  description: "Manage in-game debts easily.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
