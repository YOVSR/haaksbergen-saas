"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Dashboard() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;
      if (!sess) window.location.href = "/login";
      else setEmail(sess.user.email ?? "");
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Ingelogd als: {email}</p>

      <p><a href="/dashboard/projects">Projecten</a></p>
      <button onClick={logout}>Uitloggen</button>
    </main>
  );
}