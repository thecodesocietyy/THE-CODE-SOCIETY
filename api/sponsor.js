// Vercel Serverless Function — sends sponsor enquiries through Resend.
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DESTINATION = "thecodesociety@gmail.com";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: "Sponsor enquiries are not configured yet. Please try again later." });
  }

  const body = req.body || {};
  // Quiet honeypot field for basic bot filtering.
  if (typeof body.website === "string" && body.website.trim()) {
    return res.status(200).json({ ok: true });
  }

  const organisation = String(body.organisation || "").trim();
  const email = String(body.email || "").trim();
  const collaboration = String(body.collaboration || "").trim();

  if (!organisation || organisation.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      collaboration.length < 10 || collaboration.length > 4000) {
    return res.status(400).json({ error: "Please check the details and try again." });
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return res.status(503).json({ error: "Email sender is not configured yet. Please try again later." });
  }

  const safeText = [
    "New sponsorship / partnership enquiry",
    "",
    "Company or community: " + organisation,
    "Contact email: " + email,
    "",
    "How they would like to collaborate:",
    collaboration
  ].join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [DESTINATION],
        reply_to: email,
        subject: "Website sponsor enquiry — " + organisation,
        text: safeText
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend send failed:", response.status, detail);
      return res.status(502).json({ error: "We couldn't send your enquiry right now. Please try again shortly." });
    }

    return res.status(200).json({ ok: true, message: "Your enquiry has been sent. The team will be in touch." });
  } catch (error) {
    console.error("Sponsor enquiry error:", error);
    return res.status(502).json({ error: "We couldn't send your enquiry right now. Please try again shortly." });
  }
};
