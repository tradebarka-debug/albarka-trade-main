import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Application {
    id: number;
    name: string;
    email: string;
    telephone: string;
    experience: string;
    message: string;
    tracking_code: string;
    status: string;
}

const AdminApplications = () => {
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        const { data, error } = await supabase
            .from("applications" as never)
            .select("*");

        if (!error && data) {
            setApplications(data as unknown as Application[]);
        }
    };

    return (
        <div className="p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">
                Candidatures reçues
            </h1>

            <div className="space-y-4">
                {applications.map((app) => (
                    <div
                        key={app.id}
                        className="bg-zinc-900 p-4 rounded-xl border border-yellow-500"
                    >
                        <h2 className="text-xl font-bold text-yellow-400">
                            {app.name}
                        </h2>

                        <p><strong>Email :</strong> {app.email}</p>
                        <p><strong>Téléphone :</strong> {app.telephone}</p>
                        <p><strong>Expérience :</strong> {app.experience}</p>
                        <p><strong>Message :</strong> {app.message}</p>
                        <p><strong>Suivi :</strong> {app.tracking_code}</p>
                        <p><strong>Statut :</strong> {app.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminApplications;
