import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerificationOtpRepresentant() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-card p-8 rounded-2xl border border-primary w-full max-w-md">

        <h1 className="text-2xl text-primary font-bold text-center mb-6">
          Vérification OTP
        </h1>

        <input
          className="w-full p-4 rounded-xl mb-6 text-black placeholder:text-gray-500"
          placeholder="Entrez le code OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

       <button
  onClick={() => {
    localStorage.setItem("representantOtp", otp);
    navigate("/representant/nouveau-pin");
  }}
  className="w-full bg-primary text-black p-4 rounded-xl font-bold"
>
          Vérifier
        </button>

      </div>
    </div>
  );
}