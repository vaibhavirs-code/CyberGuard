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
