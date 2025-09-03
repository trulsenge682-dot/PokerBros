import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import SWRegister from "../components/SWRegister";

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ backgroundColor: "#111", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, paddingBottom: "56px", display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <Header />
        <main style={{ flex: "1 1 auto", overflow: "auto" }}>{children}</main>
        <BottomNav />
        <SWRegister />
      </body>
    </html>
  );
}
