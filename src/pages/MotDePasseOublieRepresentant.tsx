import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function MotDePasseOublieRepresentant() {
  const [code, setCode] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-card p-8 rounded-2xl border border-primary w-full max-w-md">

        <h1 className="text-2xl text-primary font-bold text-center mb-6">
          Mot de passe oublié
        </h1>

        <input
          className="w-full p-4 rounded-xl bg-white mb-4 text-black placeholder:text-gray-500"
          placeholder="Code représentant"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          className="w-full p-4 rounded-xl bg-white mb-4 text-black"
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />

        <input
          className="w-full p-4 rounded-xl mb-6 text-black"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

       <button
  onClick={async () => {

    const { data, error } = await supabase.functions.invoke("representant-auth", {
      body: { action: "forgot_password", code, telephone, email },
    });

    if (error || data?.error) {
      alert(data?.error || "Informations incorrectes.");
      return;
    }

    localStorage.setItem("representantCode", code);

    if (!data.smsSent) {
      alert("Un code OTP a été généré mais n'a pas pu être envoyé par SMS. Contactez le support.");
    }

    navigate("/verification-otp");

  }}
  className="w-full bg-primary text-black p-4 rounded-xl font-bold"
>
  Demander la réinitialisation
</button>

      </div>
    </div>
  );
}