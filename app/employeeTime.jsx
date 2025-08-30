import React, { useEffect, useMemo, useState } from "react";

/**
 * Restaurant Timekeeper – single-file React app
 * - Employees: add/edit/delete
 * - Time entries: clock in/out, manual add, edit/delete
 * - Summary: hours & labor $ by date range and employee
 * - Persistence: localStorage
 * - Export: CSV
 *
 * Styling uses Tailwind classes (no setup shown here).
 */

// ------- Types -------
/** @typedef {{ id:string, name:string, role:string, hourly:number, active:boolean }} Employee */
/** @typedef {{ id:string, employeeId:string, start:string, end:string|null, note?:string }} TimeEntry */

// ------- Utilities -------
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDT = (s) => new Date(s).toLocaleString();
const fmtD = (s) => new Date(s).toISOString().slice(0,10);
const parseLocalDate = (s) => new Date(s + "T00:00:00");
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const durationHours = (startISO, endISO) => {
  const end = endISO ? new Date(endISO) : new Date();
  const ms = end - new Date(startISO);
  return clamp(ms / 36e5, 0, 1e6);
};

const download = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// ------- Storage hooks -------
const useLocal = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
};

// ------- Seed (optional) -------
const seedEmployees = [
  { id: uid(), name: "Ana Pérez", role: "Server", hourly: 16, active: true },
  { id: uid(), name: "Luis Gómez", role: "Cook", hourly: 18, active: true },
];

// ------- Components -------
function App() {
  const [employees, setEmployees] = useLocal("rtk_employees", seedEmployees);
  const [entries, setEntries] = useLocal("rtk_entries", /** @type {TimeEntry[]} */([]));
  const [tab, setTab] = useState("time");

  // Filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(fmtD(new Date(Date.now()-7*864e5).toISOString()));
  const [to, setTo] = useState(fmtD(new Date().toISOString()));
  const [empFilter, setEmpFilter] = useState("all");

  const filteredEntries = useMemo(() => {
    const f = parseLocalDate(from).getTime();
    const t = new Date(parseLocalDate(to).getTime() + 86399999).getTime();
    return entries.filter(e => {
      const s = new Date(e.start).getTime();
      const within = s >= f && s <= t;
      const empOk = empFilter === "all" || e.employeeId === empFilter;
      return within && empOk;
    }).sort((a,b)=> new Date(b.start) - new Date(a.start));
  }, [entries, from, to, empFilter]);

  const activeClocks = useMemo(() => entries.filter(e => !e.end), [entries]);

  // CRUD: Employees
  const addEmployee = (emp) => setEmployees(prev => [{...emp, id: uid(), active:true}, ...prev]);
  const updateEmployee = (id, patch) => setEmployees(prev => prev.map(e => e.id===id? {...e, ...patch}: e));
  const removeEmployee = (id) => {
    if (!confirm("Delete employee? Their time entries remain.")) return;
    setEmployees(prev => prev.filter(e => e.id!==id));
  };

  // Time clock
  const clockIn = (employeeId, note="") => {
    // prevent multiple open clocks for same employee
    if (entries.some(e => e.employeeId===employeeId && !e.end)) return alert("Already clocked in.");
    setEntries(prev => [{ id: uid(), employeeId, start: new Date().toISOString(), end: null, note }, ...prev]);
  };
  const clockOut = (employeeId) => {
    const idx = entries.findIndex(e => e.employeeId===employeeId && !e.end);
    if (idx < 0) return alert("No active shift.");
    const copy = [...entries];
    copy[idx] = { ...copy[idx], end: new Date().toISOString() };
    setEntries(copy);
  };

  const addManualEntry = (employeeId, start, end, note="") => {
    if (!start || !end) return alert("Start and End are required.");
    setEntries(prev => [{ id: uid(), employeeId, start, end, note }, ...prev]);
  };
  const editEntry = (id, patch) => setEntries(prev => prev.map(e => e.id===id? {...e, ...patch}: e));
  const removeEntry = (id) => setEntries(prev => prev.filter(e => e.id!==id));

  // Summary
  const summary = useMemo(() => {
    const byEmp = new Map();
    for (const e of filteredEntries) {
      const emp = employees.find(x => x.id===e.employeeId);
      const hours = durationHours(e.start, e.end);
      const rate = emp?.hourly ?? 0;
      const amt = hours * rate;
      const cur = byEmp.get(e.employeeId) || { hours:0, amount:0, name: emp?.name || "?", rate };
      cur.hours += hours; cur.amount += amt; cur.rate = rate; cur.name = emp?.name || cur.name;
      byEmp.set(e.employeeId, cur);
    }
    const rows = [...byEmp.entries()].map(([employeeId, v]) => ({ employeeId, ...v }));
    const totals = rows.reduce((a,b)=>({ hours:a.hours+b.hours, amount:a.amount+b.amount }), {hours:0, amount:0});
    return { rows, totals };
  }, [filteredEntries, employees]);

  // Export CSV
  const exportCSV = () => {
    const header = ["Employee","Role","Hourly","Start","End","Hours","Amount","Note"]; 
    const lines = [header.join(",")];
    for (const e of filteredEntries) {
      const emp = employees.find(x => x.id===e.employeeId);
      const hours = durationHours(e.start, e.end);
      const amt = (emp?.hourly||0)*hours;
      lines.push([
        emp?.name||"", emp?.role||"", emp?.hourly||0,
        fmtDT(e.start), e.end?fmtDT(e.end):"",
        hours.toFixed(2), amt.toFixed(2), (e.note||"").replaceAll(",",";")
      ].join(","));
    }
    download(`time_entries_${from}_to_${to}.csv`, lines.join("\n"));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Restaurant Timekeeper</h1>
          <nav className="flex gap-2">
            {[
              ["time","Time"],
              ["employees","Employees"],
              ["summary","Summary"],
              ["settings","Settings"],
            ].map(([k,label]) => (
              <button key={k} onClick={()=>setTab(k)}
                className={`px-3 py-1 rounded-full border ${tab===k?"bg-slate-900 text-white":"bg-white"}`}>
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Filters */}
        <section className="bg-white border rounded-xl p-4 mb-6">
          <div className="grid md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm">Employee</label>
              <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="all">All</option>
                {employees.map(e=> <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm">From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">Search notes</label>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Contains…" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </section>

        {tab === "employees" && (
          <Employees
            employees={employees}
            onAdd={addEmployee}
            onUpdate={updateEmployee}
            onRemove={removeEmployee}
            onClockIn={clockIn}
            onClockOut={clockOut}
            activeClocks={activeClocks}
          />
        )}

        {tab === "time" && (
          <TimeEntries
            employees={employees}
            entries={filteredEntries.filter(e => (q? (e.note||"").toLowerCase().includes(q.toLowerCase()): true))}
            onManual={addManualEntry}
            onEdit={editEntry}
            onRemove={removeEntry}
            onClockOut={clockOut}
          />
        )}

        {tab === "summary" && (
          <Summary summary={summary} onExport={exportCSV} from={from} to={to} />
        )}

        {tab === "settings" && (
          <Settings onWipe={()=>{ if(confirm("Erase all local data?")){ localStorage.clear(); location.reload(); } }} />
        )}
      </div>
    </div>
  );
}

function Employees({ employees, onAdd, onUpdate, onRemove, onClockIn, onClockOut, activeClocks }) {
  const [form, setForm] = useState({ name:"", role:"", hourly:16 });

  return (
    <section className="grid md:grid-cols-3 gap-6">
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Add employee</h2>
        <div className="space-y-2">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} />
          <input type="number" min="0" step="0.25" className="w-full border rounded-lg px-3 py-2" placeholder="Hourly $" value={form.hourly} onChange={e=>setForm({...form, hourly: Number(e.target.value)})} />
          <button
            className="w-full bg-slate-900 text-white rounded-lg py-2"
            onClick={() => {
              if(!form.name.trim()) return alert("Name is required");
              onAdd({ name: form.name.trim(), role: form.role.trim(), hourly: Number(form.hourly)||0 });
              setForm({ name:"", role:"", hourly:16 });
            }}
          >Add</button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Employees</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Hourly</th>
                <th>Status</th>
                <th>Clock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e=>{
                const ticking = activeClocks.some(x => x.employeeId===e.id);
                return (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2">
                    <input className="border rounded px-2 py-1 w-48" value={e.name} onChange={ev=>onUpdate(e.id, { name: ev.target.value })} />
                  </td>
                  <td>
                    <input className="border rounded px-2 py-1 w-40" value={e.role} onChange={ev=>onUpdate(e.id, { role: ev.target.value })} />
                  </td>
                  <td>
                    <input type="number" step="0.25" className="border rounded px-2 py-1 w-24" value={e.hourly} onChange={ev=>onUpdate(e.id, { hourly: Number(ev.target.value)||0 })} />
                  </td>
                  <td>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={e.active} onChange={ev=>onUpdate(e.id, { active: ev.target.checked })} />
                      <span>{e.active?"Active":"Inactive"}</span>
                    </label>
                  </td>
                  <td>
                    {ticking
                      ? <button className="px-2 py-1 border rounded" onClick={()=>onClockOut(e.id)}>Clock out</button>
                      : <button className="px-2 py-1 border rounded" onClick={()=>onClockIn(e.id)}>Clock in</button>}
                  </td>
                  <td>
                    <button className="px-2 py-1 text-red-600" onClick={()=>onRemove(e.id)}>Delete</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TimeEntries({ employees, entries, onManual, onEdit, onRemove, onClockOut }) {
  const [m, setM] = useState({ employeeId: employees[0]?.id || "", start: new Date().toISOString().slice(0,16), end: new Date().toISOString().slice(0,16), note: "" });

  useEffect(()=>{ if (!m.employeeId && employees[0]) setM(prev=>({...prev, employeeId: employees[0].id})); }, [employees]);

  return (
    <section className="grid md:grid-cols-3 gap-6">
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Manual entry</h2>
        <div className="space-y-2">
          <select className="w-full border rounded-lg px-3 py-2" value={m.employeeId} onChange={e=>setM({...m, employeeId:e.target.value})}>
            {employees.map(e=> <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <label className="block text-sm">Start</label>
          <input type="datetime-local" className="w-full border rounded-lg px-3 py-2" value={m.start} onChange={e=>setM({...m, start:e.target.value})} />
          <label className="block text-sm">End</label>
          <input type="datetime-local" className="w-full border rounded-lg px-3 py-2" value={m.end} onChange={e=>setM({...m, end:e.target.value})} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Note (optional)" value={m.note} onChange={e=>setM({...m, note:e.target.value})} />
          <button className="w-full bg-slate-900 text-white rounded-lg py-2" onClick={()=>onManual(m.employeeId, new Date(m.start).toISOString(), new Date(m.end).toISOString(), m.note)}>Add entry</button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Time entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Employee</th>
                <th>Start</th>
                <th>End</th>
                <th>Hours</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e=>{
                const emp = employees.find(x=>x.id===e.employeeId);
                const hours = durationHours(e.start, e.end);
                return (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 w-40">{emp?.name||"?"}</td>
                  <td className="w-56">
                    <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={e.start.slice(0,16)} onChange={ev=>onEdit(e.id, { start: new Date(ev.target.value).toISOString() })} />
                  </td>
                  <td className="w-56">
                    {e.end ? (
                      <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={e.end.slice(0,16)} onChange={ev=>onEdit(e.id, { end: new Date(ev.target.value).toISOString() })} />
                    ) : (
                      <button className="px-2 py-1 border rounded" onClick={()=>onClockOut(e.employeeId)}>Clock out</button>
                    )}
                  </td>
                  <td className="w-20 text-right tabular-nums">{hours.toFixed(2)}</td>
                  <td className="w-64">
                    <input className="border rounded px-2 py-1 w-full" value={e.note||""} onChange={ev=>onEdit(e.id, { note: ev.target.value })} />
                  </td>
                  <td className="w-20 text-right">
                    <button className="px-2 py-1 text-red-600" onClick={()=>onRemove(e.id)}>Delete</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Summary({ summary, onExport, from, to }) {
  return (
    <section className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Summary</h2>
        <button className="px-3 py-1 border rounded" onClick={onExport}>Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Employee</th>
              <th>Hourly</th>
              <th>Hours</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map(r=> (
              <tr key={r.employeeId} className="border-b last:border-0">
                <td className="py-2">{r.name}</td>
                <td className="tabular-nums">${r.rate.toFixed(2)}</td>
                <td className="tabular-nums">{r.hours.toFixed(2)}</td>
                <td className="tabular-nums">${r.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-2">Totals</td>
              <td></td>
              <td className="tabular-nums">{summary.totals.hours.toFixed(2)}</td>
              <td className="tabular-nums">${summary.totals.amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">Range: {from} to {to}</p>
    </section>
  );
}

function Settings({ onWipe }) {
  return (
    <section className="bg-white border rounded-xl p-4">
      <h2 className="font-semibold mb-2">Settings</h2>
      <p className="text-sm text-slate-600 mb-4">Data is stored locally in your browser (localStorage). For multi-user or payroll export, integrate a backend (e.g., Firebase, Supabase, or your API).</p>
      <button className="px-3 py-2 border rounded text-red-600" onClick={onWipe}>Erase local data</button>
    </section>
  );
}

export default App;
