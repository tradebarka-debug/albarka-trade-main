import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function RepresentantForm() {
    const [form, setForm] = useState({

        nom: "",
        prenom: "",
        telephone: "",
        email: "",
        pays: "",
        ville: "",
        typePiece: "",
        numeroPiece: "",
        pin: "",
        confirmPin: "",
    });
    const parrain = new URLSearchParams(window.location.search).get("parrain");
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <section className="max-w-2xl mx-auto py-10 px-6">


            <Link
                to="/representant-home"
                className="inline-flex items-center gap-2 mb-6 text-green-600 hover:text-green-700"
            >
                <ArrowLeft size={20} />
                Retour
            </Link>

            <h2 className="text-4xl font-bold text-primary text-center mb-10">
                Enregistrement Officiel
            </h2>

            <div className="grid md:grid-cols-2 gap-6">

                <input
                    name="nom"
                    placeholder="Nom"
                    value={form.nom}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                />

                <input
                    name="prenom"
                    placeholder="Prénom"
                    value={form.prenom}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                />

                <input
                    name="telephone"
                    placeholder="Téléphone"
                    value={form.telephone}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                />

                <input
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                />

                <select
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                >
                    <option value="">Choisir un pays</option>
                    <option>Côte d'Ivoire</option>
                    <option>Burkina Faso</option>
                    <option>Mali</option>
                    <option>Sénégal</option>
                    <option>Bénin</option>
                    <option>Togo</option>
                    <option>Ghana</option>
                </select>
                <select
                    name="typePiece"
                    value={form.typePiece}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary"
                >
                    <option value="">Type de pièce</option>
                    <option value="CNI">Carte Nationale d'Identité</option>
                    <option value="Passeport">Passeport</option>
                </select>

                <input
                    type="text"
                    name="numeroPiece"
                    value={form.numeroPiece}
                    onChange={handleChange}
                    placeholder="Numéro de la CNI ou du Passeport"
                    className="p-4 rounded-xl bg-card border border-primary"
                />
                <input
                    name="ville"
                    placeholder="Ville"
                    value={form.ville}
                    onChange={handleChange}
                    className="p-4 rounded-xl bg-card border border-primary/20"
                />
                <div className="md:col-span-2">
                    <label className="block mb-2 font-medium">
                        Téléverser la CNI ou le Passeport
                    </label>

                    <input
                        type="file"
                        name="piece"
                        accept="image/*,.pdf"
                        className="w-full p-3 border rounded-xl"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <input
                    type="password"
                    name="pin"
                    value={form.pin}
                    onChange={handleChange}
                    placeholder="6 chiffres"
                    className="p-4 rounded-xl bg-card border border-primary w-full"
                />
            </div>

            <div className="space-y-2">
                <input
                    type="password"
                    name="confirmPin"
                    value={form.confirmPin}
                    onChange={handleChange}
                    placeholder="Confirmer votre Code PIN"
                    className="p-4 rounded-xl bg-card border border-primary w-full"
                />
            </div>
            <div className="md:col-span-2 text-center mt-6">
                <Button
                    size="lg"
                    className="w-full md:w-80"
                   onClick={async () => {
                        if (form.pin !== form.confirmPin) {
                            alert("Les deux Codes PIN ne correspondent pas.");
                            return;
                        }
                        const codeRepresentant = "ATI-REP-" + Date.now();
                        const { error } = await supabase
                            .from("representants")
                            .insert({
                                code: codeRepresentant,
                                nom: form.nom,
                                prenom: form.prenom,
                                telephone: form.telephone,
                                email: form.email,
                                pays: form.pays,
                                ville: form.ville,
                                type_piece: form.typePiece,
                                numero_piece: form.numeroPiece,
                                pin: form.pin,
                                parrain: parrain,
                            });

                        if (error) {
                            alert(error.message);
                            return;
                        }

                        localStorage.setItem("representantCode", codeRepresentant);
                        localStorage.setItem("representantPin", form.pin);
                        window.location.href = "/dashboard-representant";
                    }}
                >
                    Continuer
                </Button>
            </div>

        </section>
    );
}