import Anthropic from "@anthropic-ai/sdk";

// API klíč se NIKDY nedává do frontendu – čte se z proměnné prostředí na serveru.
// Na Vercelu ho nastavíte v Settings → Environment Variables jako ANTHROPIC_API_KEY.
const client = new Anthropic();

// Model: výchozí je nejschopnější Claude Opus 4.8. Pro veřejného chatbota na webu
// bývá levnější varianta plně dostačující – stačí změnit na "claude-haiku-4-5".
const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `Jsi přátelský český asistent firmy Ploty Náplava – rodinné firmy z okolí Uherského Hradiště (sídlo Polešovice 297, 687 37 Polešovice), která staví ploty, brány a branky na klíč.

Co firma nabízí:
- Klasické pletivo – cenově dostupné oplocení pro každý pozemek i terén.
- Svařované pletivo / 3D panely – pevné a tuhé panely s vysokou odolností a dlouhou životností.
- Dřevěné ploty – přírodní vzhled a soukromí, dřevo na míru.
- Brány a branky – posuvné i křídlové brány, branky, možnost dálkového ovládání.
- Bezplatné zaměření a nezávazná cenová nabídka, vlastní montážní tým, práce v termínu.

Kontakt: telefon +420 723 123 456, e-mail snaplava@seznam.cz.
Otevírací doba: Po–Pá 8:00–17:00, So 9:00–12:00, Ne zavřeno (telefonicky i mimo dobu).

Jak odpovídat:
- Vždy česky, stručně, srdečně a k věci (ideálně 2–5 vět).
- NEUVÁDĚJ konkrétní ceny – cena závisí na zaměření; nabídni bezplatnou cenovou nabídku.
- Když má zákazník zájem, nasměruj ho k vyplnění poptávkového formuláře (sekce „Nezávazná poptávka" na stránce) nebo k telefonu +420 723 123 456.
- Pokud něco nevíš jistě (přesné termíny, dostupnost, ceny), řekni, že to nejlépe upřesní firma po zaměření, a nabídni kontakt.
- Nevymýšlej si údaje, které tu nejsou uvedené.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Chybí zprávy." });
    }

    // bezpečnostní ořez: jen role user/assistant, posledních 20 zpráv, rozumná délka
    const clean = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (clean.length === 0) {
      return res.status(400).json({ error: "Neplatné zprávy." });
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: clean,
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Chyba serveru." });
  }
}
