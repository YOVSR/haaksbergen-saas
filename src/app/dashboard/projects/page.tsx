"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  status: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    const { data: sessData } = await supabase.auth.getSession();
    if (!sessData.session) return (window.location.href = "/login");

    const res = await supabase.from("projects").select("id,name,customer_name,status").order("created_at", { ascending: false });
    if (res.error) return setMsg(res.error.message);
    setProjects(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addProject() {
    setMsg("");
    // org_id wordt via RLS gecheckt, maar moet wel mee in insert.
    // We halen org_id op uit profiles.
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return (window.location.href = "/login");

    const prof = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (prof.error) return setMsg(prof.error.message);

    const ins = await supabase.from("projects").insert({
      org_id: prof.data.org_id,
      name,
      customer_name: customer || null,
      status: "active",
    });

    if (ins.error) return setMsg(ins.error.message);

    setName("");
    setCustomer("");
    await load();
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Projecten</h1>
      <p><a href="/dashboard">← terug</a></p>

      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input placeholder="Projectnaam" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Klant (optioneel)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <button onClick={addProject} disabled={!name.trim()}>Project toevoegen</button>
        {msg ? <p style={{ color: "crimson" }}>{msg}</p> : null}
      </div>

      <hr style={{ margin: "24px 0" }} />

      <ul style={{ display: "grid", gap: 8 }}>
        {projects.map((p) => (
          <li key={p.id}>
            <a href={`/dashboard/projects/${p.id}`}>{p.name}</a>
            {" "}— {p.customer_name ?? "geen klant"} — {p.status}
          </li>
        ))}
      </ul>
    </main>
  );
}