import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Connexion de l’établissement — OptiHora" },
    { name: "description", content: "Connectez votre établissement à OptiHora pour gérer ses emplois du temps." },
    { property: "og:title", content: "Connexion de l’établissement — OptiHora" },
    { property: "og:description", content: "Créez ou ouvrez le compte de votre école, collège ou lycée." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

const types = ["École", "Collège", "Lycée"];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Collège");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setInfo(""); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("E-mail ou mot de passe incorrect.");
        navigate({ to: "/" });
      } else {
        if (!name.trim() || !city.trim()) throw new Error("Renseignez le nom et la ville de l’établissement.");
        if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { name: name.trim(), type, city: city.trim() } } });
        if (error) throw new Error(error.message);
        if (data.session) navigate({ to: "/" });
        else { setInfo("Compte créé. Ouvrez l’e-mail de confirmation, puis connectez-vous."); setMode("login"); }
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
    finally { setBusy(false); }
  }

  return <div className="grid min-h-screen place-items-center bg-background p-6">
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">O</div>
        <span className="font-display text-xl font-bold">OptiHora</span>
      </div>
      <h1 className="font-display text-2xl font-bold">{mode === "login" ? "Connexion de l’établissement" : "Créer le compte de l’établissement"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Un compte commun pour les enseignants et le personnel administratif.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        {mode === "signup" && <>
          <div className="space-y-2"><Label htmlFor="school-name">Nom de l’établissement</Label><Input id="school-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Lycée Victor Hugo" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="school-type">Type</Label><Select value={type} onValueChange={setType}><SelectTrigger id="school-type"><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="school-city">Ville</Label><Input id="school-city" required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} /></div>
          </div>
        </>}
        <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {info && <p role="status" className="text-sm text-primary">{info}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{mode === "login" ? "Se connecter" : "Créer le compte"}</Button>
      </form>
      <button type="button" className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
        {mode === "login" ? "Pas encore de compte ? Créer le compte de l’établissement" : "Déjà un compte ? Se connecter"}
      </button>
    </div>
  </div>;
}
