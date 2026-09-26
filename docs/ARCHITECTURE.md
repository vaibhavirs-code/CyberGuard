# CyberGuard Vision — Architecture

## 1. Problem

Retail stores need a way to connect three signals that are usually isolated:

- what the camera observes;
- whether a payment was confirmed;
- what should be shared with an authorized reviewer.

The prototype therefore treats the camera as a **signal source**, the payment gateway as a **transaction source**, and the DPI event bridge as a **privacy-minimized interoperability layer**.

## 2. End-to-end architecture

```text
Camera / Video
      |
      v
TensorFlow COCO-SSD
(person detection only)
      |
      v
Anonymous Person Tracker
(P21, P22, ...)
      |
      +--> Zone + movement signals
      |         |
      |         v
      |   Behaviour / risk engine
      |         |
      |         +------> Human-review alert
      |         |             |
      |         |             +--> browser beep
      |         |             +--> Arduino buzzer
      |         |             +--> privacy-safe evidence
      |         |
      |         v
      |   DPI Event Bridge
      |
Payment Gateway
(Razorpay webhook)
      |
      v
Signature verification
      |
      v
Supabase payment_events
      |
      v
Rule-based payment matcher
      |
      v
Anonymous person track marked PAID
```

## 3. Privacy boundary

Raw camera frames stay in the camera-processing path. The DPI event contains:

- temporary subject token;
- event type;
- transaction status;
- risk level and score;
- zone;
- timestamp;
- source;
- share status;
- consent requirement.

The event layer does not require a face identity.

Incident evidence is stored locally in browser IndexedDB for the prototype. Before persistence/download, tracked-person regions are masked. The evidence store is intentionally limited to the latest five snapshots per camera in the MVP.

## 4. Authentication and roles

Supabase Auth provides email/password authentication.

The `operators` profile table maps an authenticated user to:

- operator name;
- operator ID;
- role;
- store.

Roles are `OPERATOR`, `SUPERVISOR`, and `ADMIN`. Evidence deletion is exposed only to supervisor/admin users in the current MVP.

## 5. Payment trust boundary

The browser never receives the Razorpay webhook secret.

`POST /api/payments/webhook`:

1. reads the raw request body;
2. validates `X-Razorpay-Signature` using HMAC-SHA256;
3. accepts captured-payment events;
4. stores a normalized event in Supabase using the server-only service-role key.

Authenticated operators can read recent payment events through the same route. The client then runs the existing rule-based matcher against anonymous person tracks.

## 6. Responsible-AI boundary

The prototype does **not** claim to recognize theft directly.

The model detects people. The tracker infers item-related behaviour from movement and zones. The risk engine combines multiple observable signals. A high-risk event is a **review signal**, not a verdict.

This prevents the product story from claiming capabilities that the current computer-vision stack does not actually provide.

## 7. Scalability path

The MVP is designed around replaceable boundaries:

- camera adapter -> RTSP/ONVIF/IP-camera adapters;
- payment adapter -> Razorpay or another compliant gateway;
- local evidence store -> controlled encrypted evidence service;
- DPI event service -> authorized institutional/public-service consumers;
- single store -> multi-store deployment;
- browser polling -> server-sent events/WebSockets/realtime subscriptions.

The core tracker and event schema do not need to change when these infrastructure adapters are replaced.
