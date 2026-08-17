"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-white/70 hover:text-white transition-colors"
    >
      Déconnexion
    </button>
  );
}
