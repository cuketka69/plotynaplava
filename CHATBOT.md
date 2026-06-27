# AI chatbot – návod k nasazení

Na webu je v pravém dolním rohu plovoucí tlačítko chatu. Frontend je hotový
(`index.html`, `styles.css`, `script.js`). Aby chatbot opravdu odpovídal,
potřebuje malý backend (`api/chat.js`), který bezpečně volá Claude API –
**API klíč nesmí být ve frontendu**, proto je schovaný na serveru.

## Co potřebujete

1. **API klíč k Claude** – z https://console.anthropic.com (API Keys → Create Key).
   Účet je placený podle spotřeby (chatbot na malém webu stojí řádově koruny měsíčně,
   zvlášť při levnějším modelu – viz níže).
2. **Hosting, který umí serverless funkce** – nejjednodušší je **Vercel** (zdarma pro malé weby).

## Nasazení na Vercel (nejjednodušší cesta)

1. Nahrajte celou složku projektu na Vercel (přes web vercel.com → Add New → Project,
   nebo přes GitHub).
2. Ve Vercelu otevřete projekt → **Settings → Environment Variables** a přidejte:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** váš klíč (začíná `sk-ant-...`)
3. Dejte **Deploy / Redeploy**. Vercel automaticky:
   - nainstaluje balíček `@anthropic-ai/sdk` (podle `package.json`),
   - zpřístupní funkci `api/chat.js` na adrese `/api/chat`,
   - vystaví statické stránky.

Hotovo – chat začne odpovídat.

## Lokální vyzkoušení (volitelné)

```
npm install
npm i -g vercel
vercel dev
```

Před spuštěním nastavte proměnnou `ANTHROPIC_API_KEY` (např. v souboru `.env`
nebo přes `vercel env`). Otevření přes `file://` nebo obyčejný statický server
chat fungovat nebude – potřebuje běžící `/api/chat`.

## Nastavení chatbota

V souboru `api/chat.js`:
- **Model** – `MODEL = "claude-opus-4-8"` (nejschopnější). Pro veřejný web bývá
  levnější varianta `"claude-haiku-4-5"` plně dostačující a výrazně levnější.
- **Chování a fakta o firmě** – text `SYSTEM_PROMPT` (služby, kontakty, otevírací doba).
  Tady upravte údaje, ať odpovídá realitě.

## Bezpečnost

- `ANTHROPIC_API_KEY` je jen na serveru (proměnná prostředí), nikdy v prohlížeči.
- Funkce ořezává historii (max 20 zpráv) a délku zpráv, aby se omezilo zneužití.
- Zvažte přidání limitu požadavků (rate limiting) podle návštěvnosti.
