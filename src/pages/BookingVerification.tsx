import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function BookingVerification() {
  const { bookingNumber } = useParams();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_number", bookingNumber)
        .single();

      if (!error) {
        setBooking(data);
      }

      setLoading(false);
    };

    loadBooking();
  }, [bookingNumber]);

  if (loading) {
    return <div className="p-10">Chargement...</div>;
  }

  if (!booking) {
    return (
      <div className="p-10 text-red-600 font-bold">
        Réservation introuvable.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Vérification du billet
      </h1>

      <div className="space-y-4">

        <p><strong>Réservation :</strong> {booking.booking_number}</p>

        <p><strong>Voyageur :</strong> {booking.passenger_name}</p>

        <p><strong>Téléphone :</strong> {booking.phone}</p>

        <p><strong>Départ :</strong> {booking.departure}</p>

        <p><strong>Destination :</strong> {booking.destination}</p>

        <p><strong>Date :</strong> {booking.travel_date}</p>

        <p><strong>Paiement :</strong> {booking.payment_status}</p>

        <p><strong>Statut :</strong> {booking.booking_status}</p>

      </div>

    </div>
  );
}