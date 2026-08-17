"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-shelf-muted hover:text-shelf-text transition-colors"
    >
      Déconnexion
    </button>
  );
}
