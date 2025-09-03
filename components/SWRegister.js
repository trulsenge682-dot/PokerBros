"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    // Service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Seed spillere hvis tomt
    try {
      const existing = JSON.parse(localStorage.getItem("pb_players") || "[]");
      if (!Array.isArray(existing) || existing.length === 0) {
        const players = [
          { id: "truls",    name: "Truls",    color: "hsl(200,85%,65%)" },
          { id: "johannes", name: "Johannes", color: "hsl(25,85%,60%)"  },
          { id: "emil",     name: "Emil",     color: "hsl(280,70%,70%)" },
          { id: "magnus",   name: "Magnus",   color: "hsl(140,70%,55%)" },
          { id: "viktor",   name: "Viktor",   color: "hsl(0,75%,65%)"   },
          { id: "nikolai",  name: "Nikolai",  color: "hsl(330,70%,70%)" },
          { id: "noah",     name: "Noah",     color: "hsl(45,85%,60%)"  },
          { id: "even",     name: "Even",     color: "hsl(185,65%,60%)" }
        ];
        localStorage.setItem("pb_players", JSON.stringify(players));
      }
    } catch {}

    // Standard preferanser
    try {
      const prefs = JSON.parse(localStorage.getItem("pb_user_prefs") || "{}");
      if (!prefs.theme) {
        localStorage.setItem("pb_user_prefs", JSON.stringify({ ...prefs, theme: "dark" }));
      }
    } catch {}
  }, []);

  return null;
}
