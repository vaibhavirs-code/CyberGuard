# Impact & Scalability Plan

## Target users

### Primary
- Small and medium retail stores
- Store operators and supervisors
- Security/review staff

### Secondary
- Payment providers
- Authorized auditors or investigators
- Future public/institutional digital-service integrations

## User problem

A store can have video, payment records and staff review processes, but these signals are often disconnected. That creates three practical problems:

1. a payment may not be correlated with the correct anonymous store track;
2. an unresolved exit can require manual review;
3. sharing raw video can expose more personal information than necessary.

CyberGuard Vision connects these signals while minimizing identity exposure.

## Impact model

The MVP measures the following instead of inventing impact numbers:

| Metric | Definition | Demo measurement |
|---|---|---|
| Alert latency | time from tracker alert to evidence capture | browser timestamps |
| Payment-match latency | time from captured payment event to matched person track | webhook/event timestamps |
| Evidence success rate | captured alerts that produce a stored snapshot | evidence counter |
| Ambiguous-match rate | payment events that cannot be safely attributed | payment matcher result |
| Review queue size | unresolved/possible-removal events awaiting staff review | dashboard counter |
| Privacy exposure | raw identities sent to DPI event layer | should remain zero |

## Inclusion

The MVP is designed for operators rather than requiring technical knowledge:

- large labelled controls;
- keyboard-accessible buttons and forms;
- high-contrast alert states;
- temporary anonymous person IDs;
- human-review workflow;
- optional local demo mode when external services are unavailable.

## Scalability

### Store scale
The camera registry already supports a multi-camera wall. Camera processing is isolated by camera ID and tracker instance.

### Payment scale
Payment events use a normalized adapter so the matcher is not coupled to one payment provider.

### Data scale
The DPI schema is compact and avoids sending raw video as an event payload.

### Deployment scale
The Next.js frontend can be deployed on Vercel, while Supabase provides authentication and event storage. The same event contract can later be consumed by authorized external systems.

### Reliability
The app continues camera monitoring when the optional payment bridge is unavailable. Hardware alerts are also optional; the dashboard records when the serial path is offline.

## Responsible impact

The system should be evaluated on reducing review time and improving transaction/event correlation, not on automatically labelling people as thieves. High-risk outputs remain review signals.
