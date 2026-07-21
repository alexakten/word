const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DROPS_PUBLICATION_ID = "pub_c6b80026-9bab-497c-859b-d164d8dbcedd";

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  // Silently accept bot submissions so the honeypot does not reveal itself.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ message: "You’re on the list. Keep an eye on your inbox." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!apiKey) {
    console.error("Drops signup is missing Beehiiv configuration.");
    return Response.json(
      { message: "Signups are temporarily unavailable. Please try again soon." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${DROPS_PUBLICATION_ID}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "spellsurf",
          utm_medium: "website",
          utm_campaign: "drops",
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Beehiiv signup failed:", response.status, await response.text());
      return Response.json(
        { message: "We couldn’t add you just now. Please try again." },
        { status: 502 },
      );
    }

    return Response.json({ message: "You’re on the list. Keep an eye on your inbox." });
  } catch (error) {
    console.error("Beehiiv signup request failed:", error);
    return Response.json(
      { message: "We couldn’t add you just now. Please try again." },
      { status: 502 },
    );
  }
}
