// api/lead.js — Lead capture endpoint
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, listingId, listingAddress, listingPrice, source, timestamp } = req.body || {};

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const lead = { name, email, listingId, listingAddress, listingPrice, source, timestamp };
  console.log("NEW LEAD:", JSON.stringify(lead));

  return res.status(200).json({ success: true });
};
