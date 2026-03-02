"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function signUp() {
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);

    // user kan nog "pending" zijn (email confirm). Voor MVP: zet email confirm uit in Supabase Auth settings,
    // of bouw later confirm flow.
    const userId = data.user?.id;
    if (!userId) return setMsg("Geen userId teruggekregen (check email confirm instellingen).");

    // Maak org + profile (app-side)
    const orgRes = await supabase.from("organizations").insert({ name: orgName || "Mijn bedrijf" }).select("id").single();
    if (orgRes.error) return setMsg(orgRes.error.message);

    const profRes = await supabase.from("profiles").insert({
      id: userId,
      org_id: orgRes.data.id,
      full_name: fullName,
      role: "owner",
    });

    if (profRes.error) return setMsg(profRes.error.message);

    setMsg("Account gemaakt. Log nu in.");
  }

  async function signIn() {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    window.location.href = "/dashboard";
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Login</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Naam
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Bedrijfsnaam
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Wachtwoord
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={signIn}>Inloggen</button>
          <button onClick={signUp}>Registreren</button>
        </div>

        {msg ? <p style={{ color: "crimson" }}>{msg}</p> : null}
      </div>
    </main>
  );
}