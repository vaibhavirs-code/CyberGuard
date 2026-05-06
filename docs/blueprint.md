# **App Name**: CyberGuard Vision

## Core Features:

- AI Object Detection & Tracking: Utilizes YOLOv8/v5 and multi-object trackers (e.g., ByteTrack) for stable, real-time person detection, assigning unique IDs, bounding boxes, and confidence scores across CCTV, webcam, RTSP streams, and uploaded videos.
- Configurable Smart Zones: Enables users to define, drag, and resize custom polygon or rectangle zones (Entry, Billing, Exit, Shopping) directly on the video feed, with robust functionality to save and load zone layouts.
- Automated Payment Association Tool: An AI tool that intelligently associates simulated payment events (e.g., QR scan, POS approval, webhook callback) with tracked customers in the billing zone, using timestamps, customer proximity, and zone presence to prevent misattributions.
- Simulated Payment Gateway Architecture: A modular system that simulates various payment successes/failures (QR, POS, card, UPI) with placeholders for future integration with real APIs like Razorpay, Stripe, Firebase, and POS systems, without requiring live credentials.
- Unpaid Exit Deterrent System: Automatically monitors customers at the exit zone, triggering visual alerts and sending 'ALERT' signals via pyserial to an integrated Arduino Nano to activate a physical buzzer if an unpaid customer attempts to exit.
- Dynamic Retail Intelligence Dashboard: A real-time, interactive UI displaying live video feeds, zone overlays, tracker IDs, payment statuses, and event timelines within a futuristic, animated dark theme with glowing elements and smooth transitions.
- Event Logging & Debug Console: Provides comprehensive, real-time logs for all system events including customer entry/exit, zone transitions, payment linking, serial communication with Arduino, and debugging insights for enhanced monitoring.

## Style Guidelines:

- Primary interactive elements will use a vibrant electric blue (RGB #1988F5), embodying a futuristic and technologically advanced feel. (HSL: H=210, S=90%, L=53%)
- The background will feature a deep, muted navy (RGB #080A15) for a sophisticated dark theme, providing a stark contrast to neon accents. (HSL: H=210, S=40%, L=6%)
- An accent color of luminous cyan (RGB #0FFCEB) will be used for neon glows, hover effects, and key alerts, drawing the eye with its high contrast. (HSL: H=175, S=98%, L=52%)
- Headlines and dashboard titles will use 'Space Grotesk' (sans-serif) for its modern, techy aesthetic. Body text, labels, and general information will use 'Inter' (sans-serif) for optimal readability across various data displays. 'Source Code Pro' (monospace) will be used for debug logs and code-like output.
- Geometric and minimalist icons with a subtle glow effect to align with the cyberpunk, high-tech command center aesthetic. Icons should clearly convey functionality without clutter.
- The layout features a live video feed with dynamic zone overlays on the left, a vertical panel on the right for detection data, customer lists, payment console, and event logs. A unified header proudly displays 'Smart Retail Intelligence System' across the top.
- The interface will feature a fully animated background with subtle sci-fi motion effects (e.g., floating glowing dots, cyber grid lines). UI elements will incorporate glowing hover effects, pulse animations for alerts, and smooth transitions for a dynamic and 'alive' user experience.