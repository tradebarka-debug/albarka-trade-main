import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function NouveauPinRepresentant() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError("");

    if (pin.length !== 4) {
      setError("Le Code PIN doit contenir 4 chiffres.");
      return;
    }

    if (pin !== confirmPin) {
      setError("Les Codes PIN ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const code = localStorage.getItem("representantCode");
      const otp = localStorage.getItem("representantOtp") || "";

      const { data, error } = await supabase.functions.invoke("representant-auth", {
        body: { action: "reset_pin", code, otp, pin },
      });

      if (error || data?.error) {
        setError(data?.error || "Une erreur est survenue.");
        return;
      }

      if (data.sessionToken) {
        localStorage.setItem("representantSessionToken", data.sessionToken);
      }

     navigate("/connexion-representant");
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-card p-8 rounded-2xl border border-primary w-full max-w-md">

        <h1 className="text-2xl text-primary font-bold text-center mb-6">
          Nouveau Code PIN
        </h1>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          className="w-full p-4 rounded-xl mb-4 text-black placeholder:text-gray-500"
          placeholder="Nouveau Code PIN"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, ""))
          }
        />

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          className="w-full p-4 rounded-xl mb-4 text-black placeholder:text-gray-500"
          placeholder="Confirmer le Code PIN"
          value={confirmPin}
          onChange={(e) =>
            setConfirmPin(e.target.value.replace(/\D/g, ""))
          }
        />

        {error && (
          <p className="text-red-500 mb-4 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-black p-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>

      </div>
    </div>
  );
}