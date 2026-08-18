import { useEffect, useRef, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Slide = {
  id: number;
  image_url: string;
  title: string;
  subtitle: string | null;
  text: string | null;
  button_label: string | null;
  button_link: string | null;
  country: "all" | "burkina_faso" | "cote_ivoire";
  sort_order: number;
  is_active: boolean;
};

const empty = {
  title: "",
  subtitle: "",
  text: "",
  button_label: "",
  button_link: "",
  country: "all" as Slide["country"],
  sort_order: "0",
  is_active: true,
};

const slidesTable = supabase.from("home_slides" as any) as any;

export default function AdminHomeSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await slidesTable.select("*").order("sort_order");
    if (error) toast.error("Impossible de charger les slides");
    else setSlides(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditing(null);
    setForm(empty);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const edit = (slide?: Slide) => {
    if (slide) {
      setEditing(slide);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setForm({
        title: slide.title,
        subtitle: slide.subtitle ?? "",
        text: slide.text ?? "",
        button_label: slide.button_label ?? "",
        button_link: slide.button_link ?? "",
        country: slide.country,
        sort_order: String(slide.sort_order),
        is_active: slide.is_active,
      });
      setPreview(slide.image_url);
    } else {
      reset();
    }
    setOpen(true);
  };

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    if (!image) return;
    if (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024) {
      toast.error("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum");
      return;
    }
    setFile(image);
    setPreview(URL.createObjectURL(image));
    event.target.value = "";
  };

  const upload = async () => {
    if (!file) return preview;
    const extension = file.name.split(".").pop() || "jpg";
    const path = `slides/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
    const { error } = await supabase.storage.from("home-slides").upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    return supabase.storage.from("home-slides").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!form.title.trim() || !preview) {
      toast.error("Le titre et l'image sont obligatoires");
      return;
    }

    setSaving(true);
    try {
      const image_url = await upload();
      const payload = {
        image_url,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        text: form.text.trim() || null,
        button_label: form.button_label.trim() || null,
        button_link: form.button_link.trim() || null,
        country: form.country,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      const request = editing
        ? slidesTable.update(payload).eq("id", editing.id).select("id,image_url")
        : slidesTable.insert(payload).select("id,image_url");
      const { data, error } = await request;
      if (error) throw error;
      if (!data?.length) {
        throw new Error("La slide n'a pas été modifiée. Vérifiez vos droits d'administration puis réessayez.");
      }

      toast.success(editing ? "Slide modifiée" : "Slide ajoutée");
      setOpen(false);
      reset();
      void load();
    } catch (error) {
      toast.error(
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Enregistrement impossible",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Supprimer cette slide ?")) return;
    const { error } = await slidesTable.delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else {
      toast.success("Slide supprimée");
      void load();
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Slides de l'accueil</h1>
          <p className="text-muted-foreground">Gérez le carrousel commercial de la page d'accueil.</p>
        </div>
        <Button onClick={() => edit()}><Plus className="mr-2 h-4 w-4" />Ajouter une slide</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {slides.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="flex gap-4 p-4">
              <img src={slide.image_url} alt="" className="h-24 w-32 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{slide.title}</p>
                <p className="truncate text-sm text-muted-foreground">{slide.subtitle || slide.text || "Sans texte"}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {slide.country} · ordre {slide.sort_order} · {slide.is_active ? "Actif" : "Masquée"}
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => edit(slide)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(slide.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Modifier la slide" : "Nouvelle slide"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Image *</Label>
              <p className="mt-1 text-xs text-muted-foreground">Format conseillé : 1600 × 900 px, JPG, PNG ou WebP (5 Mo maximum).</p>
              {preview ? (
                <div className="relative mt-2 h-44 overflow-hidden rounded-lg">
                  <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-2">
                    <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>Remplacer</Button>
                    <Button type="button" size="icon" variant="destructive" onClick={() => { setPreview(null); setFile(null); }}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  <ImageIcon className="mb-2 h-7 w-7" />Télécharger une image
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={choose} />
            </div>

            <Field label="Titre *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Sous-titre"><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Field>
            <Field label="Texte"><Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texte du bouton"><Input value={form.button_label} onChange={(e) => setForm({ ...form, button_label: e.target.value })} /></Field>
              <Field label="Lien du bouton"><Input value={form.button_link} placeholder="/boutique" onChange={(e) => setForm({ ...form, button_link: e.target.value })} /></Field>
              <Field label="Pays">
                <select className="h-10 w-full rounded-md border bg-background px-3" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value as Slide["country"] })}>
                  <option value="all">Tous les pays</option>
                  <option value="burkina_faso">Burkina Faso</option>
                  <option value="cote_ivoire">Côte d'Ivoire</option>
                </select>
              </Field>
              <Field label="Ordre"><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3"><Label>Slide active</Label><Switch checked={form.is_active} onCheckedChange={(is_active) => setForm({ ...form, is_active })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={() => void save()}>{saving && <Upload className="mr-2 h-4 w-4 animate-pulse" />}Sauvegarder</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
