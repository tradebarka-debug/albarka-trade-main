import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, XCircle, Clock, Loader2, Image } from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PaymentRequest {
  id: string;
  created_at: string;
  customer_name: string | null;
  telephone: string | null;
  address: string | null;
  total: number | null;
  amount: number | null;
  payment_method: string | null;
  transaction_ref: string | null;
  status: string | null;
  promo_code: string | null;
  items: string | null;
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
  contact: {
    phone_number: string | null;
  } | null;
  order_items?: OrderItem[];
  admin_notes?: string | null;
  screenshot_url?: string | null;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // First get all payment requests
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('orders' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Then get profiles for each payment

      const enrichedPayments = paymentsData || [] as unknown as PaymentRequest[];

      // Combine data


      setPayments((paymentsData || []) as unknown as PaymentRequest[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error("Erreur lors du chargement des paiements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selectedPayment) return;

    try {
      console.log("Paiement sélectionné :", selectedPayment);
      console.log("ID :", selectedPayment.id);

      const { error } = await supabase
        .from('orders' as any)
        .update({
          status,
        })
        .eq('id', selectedPayment.id);

      console.log("Erreur Supabase :", error);

      if (error) throw error;
      if (status === "approved") {
        window.open("https://web.whatsapp.com", "_blank");
      }
      toast.success(
        status === "approved"
          ? "Paiement approuvé"
          : "Paiement rejeté"
      );

      setIsConfirmOpen(false);
      setIsDetailOpen(false);
      setAdminNotes("");
      fetchPayments();

    } catch (error) {
      console.error("Error updating payment:", error);
      alert(JSON.stringify(error));
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "orange_money": return "Orange Money";
      case "wave": return "Wave";
      case "moov_money": return "Moov Money";
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "orange_money": return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "wave": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "moov_money": return "bg-green-500/20 text-green-700 border-green-500/30";
      default: return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Approuvé</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      (payment.transaction_ref || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.telephone || "").includes(searchTerm);

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = payments.filter(p => p.status === "pending").length;
  const approvedCount = payments.filter(p => p.status === "approved").length;
  const rejectedCount = payments.filter(p => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Paiements</h1>
        <p className="text-muted-foreground mt-1">
          Vérifiez et validez les paiements mobile money
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
          <p className="text-sm text-yellow-700">En attente</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
          <p className="text-sm text-green-700">Approuvés</p>
          <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <p className="text-sm text-red-700">Rejetés</p>
          <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par référence, email, nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "Tous" : status === "pending" ? "En attente" : status === "approved" ? "Approuvés" : "Rejetés"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun paiement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.profiles?.full_name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">{payment.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPaymentMethodColor(payment.payment_method)}>
                      {getPaymentMethodLabel(payment.payment_method)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.transaction_ref}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(Number(payment.amount))}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setAdminNotes(payment.admin_notes || "");
                        setIsDetailOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedPayment.profiles?.full_name || "N/A"}</p>
                  <p className="text-sm">{selectedPayment.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedPayment.telephone || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Méthode</p>
                  <Badge variant="outline" className={getPaymentMethodColor(selectedPayment.payment_method)}>
                    {getPaymentMethodLabel(selectedPayment.payment_method)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="text-xl font-bold text-primary">{formatPrice(Number(selectedPayment.amount))}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Référence de transaction</p>
                <p className="font-mono bg-muted p-2 rounded">{selectedPayment.transaction_ref}</p>
              </div>

              {/* Order Items */}
              {selectedPayment.order_items && selectedPayment.order_items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Articles commandés</p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {selectedPayment.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.product_name} <span className="text-muted-foreground">x{item.quantity}</span>
                        </span>
                        <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPayment.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capture d'écran</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Image className="w-4 h-4" />
                    Voir la capture
                  </Button>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter une note..."
                  disabled={selectedPayment.status !== "pending"}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Statut actuel</p>
                {getStatusBadge(selectedPayment.status)}
              </div>

              {selectedPayment.status === "pending" && selectedPayment.order_items && selectedPayment.order_items.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    L'approbation déduira automatiquement les quantités du stock
                  </p>
                </div>
              )}

              {selectedPayment.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setConfirmAction("reject");
                      setIsConfirmOpen(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setConfirmAction("approve");
                      setIsConfirmOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Approuver ce paiement ?" : "Rejeter ce paiement ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve"
                ? "Vous confirmez avoir vérifié ce paiement et qu'il est valide."
                : "Vous confirmez que ce paiement est invalide ou frauduleux."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              onClick={() => handleUpdateStatus(confirmAction === "approve" ? "approved" : "rejected")}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPayments;
