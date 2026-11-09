import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, MessageCircle, Send, X, RotateCcw, Sparkles, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSchool } from "@/components/SchoolProvider";
import { useOpti } from "@/components/OptiProvider";
import { optiCatalog, optiImage, type OptiMood } from "@/lib/opti-assets";
import { askOpti } from "@/lib/opti.functions";
import type { z } from "zod";
import type { optiReplySchema } from "@/lib/opti-assistant";

type Destination = z.infer<typeof optiReplySchema>["destination"];
type Message = { role: "user" | "assistant"; content: string; destination?: Destination };
const welcome: Message = { role: "assistant", content: "Bonjour, je suis Opti ! Que souhaitez-vous préparer pour votre établissement ?" };
export function OptiAssistant() {
  const school = useSchool();
  const { activity } = useOpti();
  const ask = useServerFn(askOpti);
  const [open, setOpen] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [mood, setMood] = useState<OptiMood>("welcome");
  const [reduced, setReduced] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "nearest" }); }, [messages, pending, open, reduced]);
  useEffect(() => { if (open && !gallery) field.current?.focus(); }, [open, gallery]);
  const currentMood = pending ? "thinking" : activity?.mood ?? mood;
  const image = optiImage(currentMood, reduced);
  async function send(question = input) {
    if (pending || !question.trim()) return;
    const next: Message[] = [...messages, { role: "user", content: question.trim() }];
    setMessages(next); setPending(true); setError(""); setInput(""); setGallery(false);
    try {
      const schoolContext = JSON.stringify({ name: school.establishment.name, classes: school.classes, teachers: school.teachers, rooms: school.rooms, subjects: school.subjects.map(({ id, name }) => ({ id, name })), settings: school.settings, constraints: school.constraints, schedules: school.schedules });
      const result = await ask({ data: { messages: next.slice(-20).map(({ role, content }) => ({ role, content })), school: schoolContext.slice(0, 50000) } });
      if (!result.ok) { setError(result.message); setInput(question); setMood("error"); return; }
      setMessages((previous) => [...previous, { role: "assistant", content: result.reply, destination: result.destination }]);
      setMood(result.mood);
    } catch { setError("Opti n’a pas pu vous répondre. Votre message est conservé."); setInput(question); setMood("error"); }
    finally { setPending(false); }
  }
  return <div className="opti-dock">
    {open && <section role="dialog" aria-label="Assistant Opti" className="opti-panel flex flex-col overflow-hidden rounded-lg border bg-card shadow-soft">
      <header className="flex shrink-0 items-center gap-3 border-b bg-accent/40 p-4">
        <img src={image.url} alt={`Opti · ${currentMood}`} className="size-16 object-contain" />
        <div className="min-w-0 flex-1"><h2 className="font-display text-lg font-semibold">Opti</h2><p className="text-xs text-muted-foreground">Votre compagnon OptiHora</p></div>
        <Button variant="ghost" size="icon" title={gallery ? "Conversation" : "Les visages d’Opti"} aria-label={gallery ? "Conversation" : "Les visages d’Opti"} onClick={() => setGallery(!gallery)}>{gallery ? <MessageCircle /> : <Images />}</Button>
        <Button variant="ghost" size="icon" title="Nouvelle conversation" aria-label="Nouvelle conversation" disabled={pending} onClick={() => { setMessages([welcome]); setMood("welcome"); setError(""); setInput(""); }}><RotateCcw /></Button>
        <Button variant="ghost" size="icon" title="Fermer Opti" aria-label="Fermer Opti" onClick={() => setOpen(false)}><X /></Button>
      </header>
      {gallery ? <div className="min-h-0 flex-1 overflow-y-auto p-4">{["Base", "Humeurs", "Vues", "annimation opti"].map((category) => <section key={category} className="mb-6"><h3 className="mb-3 text-sm font-semibold">{category === "annimation opti" ? "Animations" : category}</h3><div className="grid grid-cols-3 gap-3">{optiCatalog.filter((asset) => asset.category === category).map((asset) => <figure key={asset.id} className="min-w-0"><img loading="lazy" src={reduced && asset.animated ? optiImage("welcome", true).url : asset.url} alt={asset.name} className="aspect-square w-full rounded-md bg-muted/30 object-contain" /><figcaption className="mt-1 break-words text-center text-[10px] leading-4 text-muted-foreground">{asset.name}</figcaption></figure>)}</div></section>)}</div> : <>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-label="Conversation avec Opti">
          {messages.map((message, i) => <div key={i} className={`max-w-[92%] whitespace-pre-wrap break-words rounded-lg p-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted/60"}`}><p>{message.content}</p>{message.destination && <Button asChild variant="outline" size="sm" className="mt-3"><Link to={message.destination}>Ouvrir {({ "/": "le tableau de bord", "/classes": "Classes", "/enseignants": "Enseignants", "/salles": "Salles", "/parametres": "Paramètres", "/emploi-du-temps": "Emploi du temps" })[message.destination]}<ArrowUpRight /></Link></Button>}</div>)}
          {messages.length === 1 && <div className="flex flex-col items-start gap-2">{["Comment générer un emploi du temps ?", "Aide-moi à gérer les indisponibilités", "Que manque-t-il dans mon établissement ?"].map((question) => <Button key={question} variant="outline" className="h-auto max-w-full whitespace-normal text-left text-xs" onClick={() => void send(question)}><Sparkles className="shrink-0" />{question}</Button>)}</div>}
          {pending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="size-4" />Opti réfléchit…</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div ref={bottom} />
        </div>
        <form className="shrink-0 border-t p-3" onSubmit={(event) => { event.preventDefault(); void send(); }}><div className="flex items-end gap-2"><Textarea ref={field} aria-label="Message à Opti" placeholder="Votre question à Opti…" maxLength={6000} value={input} onChange={(event) => setInput(event.target.value)} className="max-h-28 min-h-12 resize-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><Button size="icon" type="submit" disabled={pending || !input.trim()} aria-label="Envoyer à Opti" title="Envoyer"><Send /></Button></div><p className="mt-2 text-[10px] text-muted-foreground">Conseils IA · vos données restent inchangées</p></form>
      </>}
    </section>}
    {!open && activity && <p role="status" className="mb-2 max-w-72 rounded-lg border bg-card px-3 py-2 text-sm shadow-soft">{activity.message}</p>}
    <Button aria-label={open ? "Fermer l’assistant Opti" : "Ouvrir l’assistant Opti"} aria-expanded={open} variant="ghost" className={`opti-launcher ml-auto flex h-auto items-center gap-1 p-0 hover:bg-transparent ${activity?.mood === "flying" ? "opti-flight" : ""}`} onClick={() => setOpen(!open)}><img src={image.url} alt="Opti" className="size-24 object-contain" /><span className="rounded-md border bg-card px-3 py-2 text-sm font-semibold shadow-soft">Opti <MessageCircle className="ml-1 inline size-4" /></span></Button>
  </div>;
}