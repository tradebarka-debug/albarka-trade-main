
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
const PRIVATE_FIELDS = new Set(["pin", "otp", "otp_expire"]);

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
