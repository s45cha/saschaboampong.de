/**
 * Cloudflare Pages Function: /functions/kontakt.js
 * Verarbeitet das Kontaktformular und sendet eine E-Mail via MailChannels.
 * Endpoint: POST /kontakt
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS-Header
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const contentType = request.headers.get('content-type') || '';
    let name, email, nachricht;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name;
      email = body.email;
      nachricht = body.nachricht;
    } else {
      // application/x-www-form-urlencoded
      const formData = await request.formData();
      name = formData.get('name');
      email = formData.get('email');
      nachricht = formData.get('nachricht');
    }

    // Validierung
    if (!name || !email || !nachricht) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bitte alle Felder ausfüllen.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ungültige E-Mail-Adresse.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // E-Mail via MailChannels senden
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: 'hallo@saschaboampong.de', name: 'Sascha Boampong' }],
          reply_to: { email: email, name: name },
        },
      ],
      from: {
        email: 'kontakt@saschaboampong.de',
        name: 'Website Kontaktformular',
      },
      subject: `Neue Nachricht von ${name} – saschaboampong.de`,
      content: [
        {
          type: 'text/plain',
          value: `Neue Kontaktanfrage über saschaboampong.de\n\nName: ${name}\nE-Mail: ${email}\n\nNachricht:\n${nachricht}\n\n---\nDiese E-Mail wurde über das Kontaktformular auf saschaboampong.de gesendet.`,
        },
        {
          type: 'text/html',
          value: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f6f8fc; border-radius: 12px;">
              <h2 style="color: #0a1628; font-size: 22px; margin-bottom: 24px;">Neue Kontaktanfrage</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #475569; font-size: 14px; width: 80px;"><strong>Name</strong></td>
                  <td style="padding: 10px 0; color: #0a1628; font-size: 15px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #475569; font-size: 14px;"><strong>E-Mail</strong></td>
                  <td style="padding: 10px 0; color: #0a1628; font-size: 15px;"><a href="mailto:${email}" style="color: #157fe1;">${email}</a></td>
                </tr>
              </table>
              <div style="margin-top: 24px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="color: #475569; font-size: 13px; margin: 0 0 8px;">Nachricht:</p>
                <p style="color: #0a1628; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${nachricht}</p>
              </div>
              <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">Gesendet über das Kontaktformular auf saschaboampong.de</p>
            </div>
          `,
        },
      ],
    };

    const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    if (mailResponse.status === 202 || mailResponse.status === 200) {
      // Erfolg: Redirect zurück zur Seite mit Erfolgsmeldung
      return new Response(
        JSON.stringify({ success: true, message: 'Deine Nachricht wurde erfolgreich gesendet!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await mailResponse.text();
      console.error('MailChannels error:', mailResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut oder schreib direkt an hallo@saschaboampong.de.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('Worker error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Ein Fehler ist aufgetreten. Bitte schreib direkt an hallo@saschaboampong.de.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS für CORS Preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
