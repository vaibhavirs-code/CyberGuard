# CyberGuard Vision

Production-hardened Next.js retail monitoring dashboard with:

- person-only detection via TensorFlow COCO-SSD
- honest risk assessment based on observable zone/payment signals
- local hardware alerting over Web Serial
- build-safe TypeScript and ESLint enforcement
- health checks and runtime error handling

## Commands

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Environment

Copy `.env.example` to `.env` and set local runtime values as needed. The default configuration keeps the app in a local-only production path with no mounted Firebase client.

## Health Check

- `GET /api/health`


## Build for Billions 2026 — DPI Demo

CyberGuard Vision is presented as a **privacy-preserving retail trust layer** for the
**Reinvent Digital Public Infrastructure for Billions** track.

### Judge-friendly flow

1. **Operator Login** — secure operator authentication or transparent offline demo access.
2. **Camera Wall** — click any camera to open a full-screen view.
3. **Anonymous Person IDs** — people receive temporary IDs such as `P21`; the UI does not use face recognition.
4. **Identity Shield** — tracked-person regions are visually masked while the anonymous ID remains visible.
5. **Explainable AI Signals** — the UI shows risk state, confidence and a short reason. A risk signal is not treated as proof of wrongdoing.
6. **Payment Matching** — QR/POS/Card/UPI events can be normalized and matched against observable checkout signals.
7. **Human Review** — high-risk events are surfaced for review rather than automatically declaring theft.
8. **DPI Event Bridge** — produces structured, privacy-minimized events with subject tokens, transaction status, risk level and share status.
9. **Local Evidence** — incident snapshots are face-masked and retained in browser-local IndexedDB for the demo.

### Demo access

- Email: `demo@cyberguard.local`
- Password: `demo123`

These credentials intentionally enter the local demo sandbox. Cloud/Supabase authentication remains available separately.

### Responsible AI boundaries

- Person detection is used for movement/zone analysis; the system does not identify a person's face.
- Inferred item activity is explicitly treated as an **uncertain hypothesis**, not direct merchandise recognition.
- Payment matching can return an ambiguous result instead of forcing a match.
- High-risk output is a review signal, not a claim that a person committed theft.
- Evidence masks tracked people before local storage.
- The architecture separates raw camera input from structured DPI events so downstream systems can receive minimized event data rather than unnecessary video or identity information.

### DPI alignment

The system demonstrates an interoperable event layer around digital identity tokens, payment signals,
privacy controls, consent-aware sharing and structured store activity. This maps to the hackathon's
DPI themes around digital identity/authentication, payment systems, data exchange/consent layers,
and open/interoperable digital ecosystems. The hackathon also asks AI solutions to prioritize privacy,
safety, transparency and mitigation of harmful bias. See the event brief for the official criteria.


### Automatic alert + payment flow

When the tracker raises an automated alert, the app immediately:
- captures the current camera frame;
- masks tracked people before storing the evidence;
- saves an in-app copy to browser-local IndexedDB;
- downloads a JPG copy to the browser's configured **Downloads** folder;
- emits a short browser beep and, when the Arduino serial device is connected, sends the hardware buzzer signal.

An unpaid person with a linked item hypothesis crossing the outside boundary can trigger the alert path. This is intentionally a **review signal**, not an automatic accusation.

For real automatic payment confirmation, the app includes a server-side Razorpay webhook bridge. Captured payment events are verified, stored in Supabase, and automatically matched against anonymous person tracks. The Razorpay secret stays server-side. If the payment gateway is not configured, the demo payment controls remain available.


## Hackathon evaluation readiness

The repository maps the final MVP to the four evaluation areas shown by the organizers:

- **Impact & Scalability:** see `docs/IMPACT_AND_SCALABILITY.md`.
- **Technical Feasibility & Execution:** TypeScript, ESLint, production build, health checks, automated GitHub quality gate, camera/payment/hardware fallbacks.
- **Innovation & Problem Relevance:** privacy-minimized correlation of camera movement and payment signals through a DPI event layer.
- **UX & Accessibility:** labelled authentication, keyboard-operable controls, readable status states, human-review workflow and accessible live-region security alerts.

The complete submission checklist is in `docs/HACKATHON_DELIVERABLES.md`, and the technical architecture is in `docs/ARCHITECTURE.md`.
