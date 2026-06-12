export type PromoPartner = {
id: string;
partnerName: string;
phone: string;
promoCode: string;
commissionType: "fixed" | "percentage";
commissionValue: number;
isActive: boolean;
totalSales: number;
totalCommission: number;
level: number;
status: "active" | "suspended";
};

export const promoPartners: PromoPartner[] = [
{
id: "1",
partnerName: "Partenaire Test",
phone: "+22600000000",
promoCode: "ALBARKA001",
commissionType: "percentage",
commissionValue: 5,
isActive: true,
totalSales: 0,
totalCommission: 0,
level: 1,
status: "active",
},
];

export function findPromoPartner(code: string) {
if (!code) return null;
const cleanCode = code.trim().toUpperCase();
return (
promoPartners.find(
(partner) =>
partner.promoCode.toUpperCase() === cleanCode &&
partner.isActive === true
) || null
);
}
export function calculateCommission(
amount: number,
commissionType: "fixed" | "percentage",
commissionValue: number
) {
if (!amount || amount <= 0) return 0;
if (commissionType === "percentage") {
return Math.round((amount * commissionValue) / 100);
}
return commissionValue;
}
export function updatePartnerStats(
promoCode: string,
orderAmount: number
) {
const partner = findPromoPartner(promoCode);
if (!partner) return null;
partner.totalSales += 1;
partner.totalCommission += 
calculateCommission(
orderAmount,
partner.commissionType,
partner.commissionValue
);
// Blocage automa􀆟que après 50 ventes
if (partner.totalSales >= 50) {
partner.level = 2;
partner.commissionValue= 7;
partner.status = "active";
}
if (partner.totalSales >= 200) {
partner.level = 3;
partner.commissionValue = 10;
partner.status = "active";
}
return partner;
}