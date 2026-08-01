import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const { telephone, otp } = await req.json();

  const apiKey = Deno.env.get("INFOBIP_API_KEY");
  const baseUrl = Deno.env.get("INFOBIP_BASE_URL");

  const response = await fetch(
    `${baseUrl}/sms/2/text/advanced`,
    {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: "Albarka",
            destinations: [{ to: telephone }],
            text: `Votre code OTP Albarka Trade est : ${otp}`,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Erreur d'envoi du SMS" }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});