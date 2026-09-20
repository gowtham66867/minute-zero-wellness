# Minute Zero // Adaptive Wellness

Minute Zero is an adaptive wellness response layer for the moment before a person has the capacity for a full wellness routine. A 20-second check-in selects one small, coach-curated reset, measures the change, and learns what helps that individual next time—without turning private moments into a data product.

## Live demo

[Open Minute Zero](https://minute-zero-wellness.trilogy-1207.chatgpt.site)

The deployed demo may require ChatGPT sign-in. The newest Sarvam Voice Guide code is included in this repository and is ready to deploy once its server-side API key is configured in the hosting workspace.

## The problem

Most wellness products prescribe generic routines. When someone is overloaded, tired, or short on time, a long list of advice adds friction rather than relief. Minute Zero starts with the immediate context: mental load, available energy, time capacity, and the wellness pillar that needs support.

## How it works

1. A user completes a private six-pillar check-in in about 20 seconds.
2. The adaptive engine ranks interventions by pillar, current load, energy, available minutes, and prior local outcomes.
3. The user follows a one-, three-, five-, or ten-minute guided reset.
4. They report the shift in mental load, creating an on-device response fingerprint.
5. Future recommendations improve from that feedback, while a privacy-safe coach signal is available when human support is more appropriate.

## What makes it different

- **Six-pillar guardrail:** stress, movement, sleep, nourishment, connection, and purpose constrain recommendations instead of a free-form AI prompt.
- **Response fingerprint:** the ranking learns from measured personal outcomes, not engagement metrics.
- **Privacy by architecture:** outcomes are stored on-device; demo outcomes are never persisted; the coach signal contains no identity, journal text, or raw history.
- **Human loop:** the product explicitly surfaces a coach-ready signal rather than pretending automation is always enough.
- **Multilingual voice guide:** Sarvam-powered cue playback supports English, Hindi, Kannada, Tamil, and Telugu when `SARVAM_API_KEY` is configured.

## Judge demo path

1. Select **Load judge demo**.
2. See a personalized stress profile and an explainable Downshift recommendation.
3. Open **Preview human handoff** to inspect the privacy-safe escalation signal.
4. Start the reset, finish early, and record a new outcome to demonstrate the learning loop.

## Tech

- React 19 + TypeScript
- Vinext / Vite
- Tailwind CSS and accessible UI primitives
- Node built-in test runner
- Sarvam Translate and Text-to-Speech APIs (server-side, optional)
- WebMCP tool: `configure_wq_reset`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

For Sarvam voice, create a local `.env` file:

```bash
SARVAM_API_KEY=your_sarvam_api_key
```

The key is read only by the server route and is never sent to the browser.

## Quality evidence

```bash
npm run lint
npm test
npm run build
```

The automated suite includes 12 checks for:

- high-load and low-energy recommendation selection
- explicit pillar and time-capacity constraints
- response-fingerprint learning and confidence states
- bounded, complete six-pillar signals
- judge-demo behavior
- voice secret safety, malformed requests, English synthesis, and multilingual translation-to-speech flow

## Safety note

Minute Zero provides general wellness guidance, not medical care, diagnosis, or emergency support. The interface directs users experiencing acute distress or danger toward local emergency resources and trusted people.

## Built for

BUILD//ANYTHING 2026
