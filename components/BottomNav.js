"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const item = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        style={{
          flex: 1,
          textAlign: "center",
          padding: "10px 8px",
          color: active ? "#fff" : "#bbb",
          textDecoration: "none",
          fontSize: "14px"
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "48px",
        display: "flex",
        background: "#1b1b1b",
        borderTop: "1px solid #333",
        zIndex: 50
      }}
    >
      {item("/home", "Home")}
      {item("/sessions", "Sessions")}
    </nav>
  );
}
