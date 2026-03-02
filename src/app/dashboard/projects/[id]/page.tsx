"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const projectId = params.id;

  const [project, setProject] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [workDate, setWorkDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState<string>("8");
  const [note, setNote] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.hours ?? 0), 0),
    [entries]
  );

  async function load() {
    setMsg("");
    const { data: sessData } = await supabase.auth.getSession();
    if (!sessData.session) return (window.location.href = "/login");

    const p = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (p.error) return setMsg(p.error.message);
    setProject(p.data);

    const te = await supabase
      .from("time_entries")
      .select("id,work_date,hours,note,created_at")
      .eq("project_id", projectId)
      .order("work_date", { ascending: false });

    if (te.error) return setMsg(te.error.message);
    setEntries(te.data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEntry() {
    setMsg("");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return (window.location.href = "/login");

    // org_id nodig (RLS check + insert)
    const prof = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (prof.error) return setMsg(prof.error.message);

    const ins = await supabase.from("time_entries").insert({
      org_id: prof.data.org_id,
      project_id: projectId,
      user_id: user.id,
      work_date: workDate,
      hours: Number(hours),
      note: note || null,
      cost_rate: 0,
      source: "manual",
    });

    if (ins.error) return setMsg(ins.error.message);

    setNote("");
    await load();
  }

  return (
    <main style={{ padding: 24 }}>
      <p><a href="/dashboard/projects">← terug</a></p>

      <h1>{project?.name ?? "Project"}</h1>
      {project?.customer_name ? <p>Klant: {project.customer_name}</p> : null}

      <p><b>Totaal geboekte uren:</b> {totalHours}</p>

      <h2>Uren boeken</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>
          Datum
          <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Uren
          <input value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Notitie
          <input value={note} onChange={(e) => setNote(e.target.value)} style={{ width: "100%" }} />
        </label>

        <button onClick={addEntry}>Toevoegen</button>
        {msg ? <p style={{ color: "crimson" }}>{msg}</p> : null}
      </div>

      <h2 style={{ marginTop: 24 }}>Registraties</h2>
      <ul style={{ display: "grid", gap: 8 }}>
        {entries.map((e) => (
          <li key={e.id}>
            {e.work_date}: {e.hours} uur {e.note ? `— ${e.note}` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}