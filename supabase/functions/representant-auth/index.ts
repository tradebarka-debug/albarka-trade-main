
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = [
  "https://albarka-trade.lovable.app",
  "https://albarka-trade.com",
  "https://www.albarka-trade.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
  const allowedOrigin = allowedOrigins.includes(origin) || isLocalOrigin ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

// Champs sensibles qu'on ne renvoie jamais au navigateur
const PRIVATE_FIELDS = new Set(["pin", "otp", "otp_expire", "password_hash"]);

function sanitize(row: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (!PRIVATE_FIELDS.has(key)) clean[key] = row[key];
  }
  return clean;
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createSessionToken(secret: string, code: string) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 jours
  const payload = `${code}.${expiresAt}`;
  const signature = await hmac(secret, payload);
  return `${payload}.${signature}`;
}

async function verifySessionToken(secret: string, token: string, expectedCode: string) {
  const parts = token?.split(".") ?? [];
  if (parts.length !== 3) return false;
  const [code, expiresAtStr, signature] = parts;
  if (code !== expectedCode) return false;

  const expectedSignature = await hmac(secret, `${code}.${expiresAtStr}`);
  if (expectedSignature !== signature) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 }, key, 256);
  return `pbkdf2_sha256$120000$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterations, saltValue, expected] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !saltValue || !expected) return false;
  const salt = Uint8Array.from(atob(saltValue), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: Number(iterations) }, key, 256);
  const actual = bytesToBase64(new Uint8Array(bits));
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

function normalizeContact(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function generateAmbassadorCode() {
  return `ALB-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sessionSecret = Deno.env.get("REPRESENTANT_SESSION_SECRET");

    if (!sessionSecret) {
      return jsonResponse({ error: "Configuration serveur incomplète" }, 500, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { action, ...params } = await req.json();

    if (action === "validate_promo") {
      const promoCode = String((params as any).code || "").trim().toUpperCase();
      if (!promoCode || promoCode.length > 80) return jsonResponse({ valid: false }, 200, corsHeaders);
      const [{ data: ambassador }, { data: representant }, { data: application }, { data: commercial }, { data: partner }] = await Promise.all([
        supabaseAdmin.from("ambassadors").select("full_name").eq("promo_code", promoCode).eq("status", "active").maybeSingle(),
        supabaseAdmin.from("representants").select("nom, prenom").eq("code", promoCode).maybeSingle(),
        supabaseAdmin.from("partner_applications").select("full_name").eq("partner_code", promoCode).eq("status", "approved").maybeSingle(),
        supabaseAdmin.from("commercials").select("first_name, last_name").eq("referral_code", promoCode).eq("status", "active").maybeSingle(),
        supabaseAdmin.from("partners").select("name").or(`code.eq.${promoCode},referral_code.eq.${promoCode}`).eq("status", "active").maybeSingle(),
      ]);
      const displayName = ambassador?.full_name || (representant ? [representant.prenom, representant.nom].filter(Boolean).join(" ") : application?.full_name || (commercial ? [commercial.first_name, commercial.last_name].filter(Boolean).join(" ") : "") || partner?.name);
      return jsonResponse({ valid: Boolean(displayName), displayName: displayName || null }, 200, corsHeaders);
    }

    if (action === "ambassador_signup") {
      const fullName = String((params as any).full_name || "").trim();
      const phone = normalizeContact((params as any).phone);
      const email = normalizeContact((params as any).email);
      const password = String((params as any).password || "");
      if (fullName.length < 2) return jsonResponse({ error: "Indiquez votre nom complet" }, 400, corsHeaders);
      if (!phone && !email) return jsonResponse({ error: "Indiquez un téléphone ou un email" }, 400, corsHeaders);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "Adresse email invalide" }, 400, corsHeaders);
      if (!/^\d{4}$/.test(password)) return jsonResponse({ error: "Le mot de passe doit contenir exactement 4 chiffres" }, 400, corsHeaders);

      const [{ data: phoneAccount }, { data: emailAccount }] = await Promise.all([
        phone ? supabaseAdmin.from("ambassadors").select("id").eq("phone", phone).maybeSingle() : Promise.resolve({ data: null }),
        email ? supabaseAdmin.from("ambassadors").select("id").eq("email", email).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (phoneAccount || emailAccount) return jsonResponse({ error: "Un compte existe déjà avec ce téléphone ou cet email" }, 409, corsHeaders);

      const promoCode = generateAmbassadorCode();
      const passwordHash = await hashPassword(password);
      const { data: ambassador, error } = await supabaseAdmin.from("ambassadors").insert({
        full_name: fullName, phone: phone || null, email: email || null,
        password_hash: passwordHash, promo_code: promoCode,
      }).select("id, full_name, phone, email, promo_code, status, total_orders, total_commission, available_commission").single();
      if (error) throw error;
      const sessionToken = await createSessionToken(sessionSecret, promoCode);
      return jsonResponse({ ambassador, sessionToken }, 200, corsHeaders);
    }

    if (action === "ambassador_login") {
      const identifier = normalizeContact((params as any).identifier);
      const password = String((params as any).password || "");
      if (!identifier || !password) return jsonResponse({ error: "Identifiant et mot de passe obligatoires" }, 400, corsHeaders);
      const identifierColumn = identifier.includes("@") ? "email" : "phone";
      const { data: ambassador, error } = await supabaseAdmin.from("ambassadors").select("*")
        .eq(identifierColumn, identifier).maybeSingle();
      if (error) throw error;
      if (!ambassador || ambassador.status !== "active" || !(await verifyPassword(password, ambassador.password_hash))) {
        return jsonResponse({ error: "Téléphone/email ou mot de passe incorrect" }, 401, corsHeaders);
      }
      const sessionToken = await createSessionToken(sessionSecret, ambassador.promo_code);
      return jsonResponse({ ambassador: sanitize(ambassador), sessionToken }, 200, corsHeaders);
    }

    if (action === "ambassador_profile") {
      const promoCode = String((params as any).promoCode || "").trim().toUpperCase();
      const sessionToken = String((params as any).sessionToken || "");
      if (!(await verifySessionToken(sessionSecret, sessionToken, promoCode))) {
        return jsonResponse({ error: "Session invalide, veuillez vous reconnecter" }, 401, corsHeaders);
      }
      const { data: ambassador, error } = await supabaseAdmin.from("ambassadors").select("*").eq("promo_code", promoCode).maybeSingle();
      if (error) throw error;
      if (!ambassador) return jsonResponse({ error: "Ambassadeur introuvable" }, 404, corsHeaders);
      const { data: commissions, error: commissionsError } = await supabaseAdmin.from("ambassador_commissions")
        .select("id, order_total, commission_amount, status, created_at").eq("ambassador_id", ambassador.id)
        .order("created_at", { ascending: false }).limit(30);
      if (commissionsError) throw commissionsError;
      return jsonResponse({ ambassador: sanitize(ambassador), commissions: commissions || [] }, 200, corsHeaders);
    }

    if (action === "signup") {
      const { nom, prenom, telephone, email, pays, ville, type_piece, numero_piece, pin, parrain } = params as any;

      if (!pin || String(pin).length < 4) {
        return jsonResponse({ error: "Le code PIN doit contenir au moins 4 chiffres" }, 400, corsHeaders);
      }
      if (!telephone) {
        return jsonResponse({ error: "Le téléphone est obligatoire" }, 400, corsHeaders);
      }

      const code = "ATI-REP-" + Date.now();

      const { error } = await supabaseAdmin.from("representants").insert({
        code,
        nom,
        prenom,
        telephone,
        email,
        pays,
        ville,
        type_piece,
        numero_piece,
        pin,
        parrain: parrain || null,
      });

      if (error) throw error;

      const sessionToken = await createSessionToken(sessionSecret, code);
      return jsonResponse({ code, sessionToken }, 200, corsHeaders);
    }

    if (action === "login") {
      const { code, pin } = params as any;

      const { data, error } = await supabaseAdmin
        .from("representants")
        .select("*")
        .eq("code", code)
        .eq("pin", pin)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return jsonResponse({ error: "Code représentant ou PIN incorrect" }, 401, corsHeaders);
      }

      const sessionToken = await createSessionToken(sessionSecret, data.code);
      return jsonResponse({ representant: sanitize(data), sessionToken }, 200, corsHeaders);
    }

    if (action === "get_profile") {
      const { code, sessionToken } = params as any;

      if (!(await verifySessionToken(sessionSecret, sessionToken, code))) {
        return jsonResponse({ error: "Session invalide, veuillez vous reconnecter" }, 401, corsHeaders);
      }

      const { data, error } = await supabaseAdmin
        .from("representants")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return jsonResponse({ error: "Représentant introuvable" }, 404, corsHeaders);
      }

      return jsonResponse({ representant: sanitize(data) }, 200, corsHeaders);
    }

    if (action === "forgot_password") {
      const { code, telephone, email } = params as any;

      const { data, error } = await supabaseAdmin
        .from("representants")
        .select("id, code, telephone")
        .eq("code", code)
        .eq("telephone", telephone)
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return jsonResponse({ error: "Informations incorrectes" }, 400, corsHeaders);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expireLe = new Date(Date.now() + 10 * 60 * 1000);

      const { error: updateError } = await supabaseAdmin
        .from("representants")
        .update({ otp, otp_expire: expireLe.toISOString() })
        .eq("code", code);

      if (updateError) throw updateError;

      const apiKey = Deno.env.get("INFOBIP_API_KEY");
      const baseUrl = Deno.env.get("INFOBIP_BASE_URL");
      let smsSent = false;

      if (apiKey && baseUrl && data.telephone) {
        try {
          const smsResponse = await fetch(`${baseUrl}/sms/2/text/advanced`, {
            method: "POST",
            headers: {
              Authorization: `App ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                {
                  from: "Albarka",
                  destinations: [{ to: data.telephone }],
                  text: `Votre code OTP Albarka Trade est : ${otp}`,
                },
              ],
            }),
          });
          smsSent = smsResponse.ok;
        } catch (smsError) {
          console.error("Erreur envoi SMS OTP:", smsError);
        }
      }

      return jsonResponse({ success: true, smsSent }, 200, corsHeaders);
    }

    if (action === "reset_pin") {
      const { code, otp, pin } = params as any;

      if (!pin || String(pin).length !== 4) {
        return jsonResponse({ error: "Le Code PIN doit contenir 4 chiffres" }, 400, corsHeaders);
      }

      const { data, error } = await supabaseAdmin
        .from("representants")
        .select("otp, otp_expire")
        .eq("code", code)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.otp || data.otp !== otp) {
        return jsonResponse({ error: "Code OTP incorrect" }, 400, corsHeaders);
      }
      if (!data.otp_expire || new Date(data.otp_expire).getTime() < Date.now()) {
        return jsonResponse({ error: "Code OTP expiré" }, 400, corsHeaders);
      }

      const { error: updateError } = await supabaseAdmin
        .from("representants")
        .update({ pin, otp: null, otp_expire: null })
        .eq("code", code);

      if (updateError) throw updateError;

      const sessionToken = await createSessionToken(sessionSecret, code);
      return jsonResponse({ success: true, sessionToken }, 200, corsHeaders);
    }

    return jsonResponse({ error: "Action invalide" }, 400, corsHeaders);
  } catch (error) {
    console.error("representant-auth error:", error);
    const message = (error as any)?.message || "Une erreur est survenue";
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
});
