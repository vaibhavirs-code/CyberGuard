# Cash Detection: Level 1 + Level 2

This feature is intentionally limited to **cash presence detection**. It does not identify denomination, verify authenticity, read serial numbers, or estimate the cash amount.

## Runtime pipeline

```
camera frame
  -> checkout zone crop
  -> Level 1 visual candidate detector
  -> temporal confirmation
  -> optional Level 2 trained detector
  -> ensemble result
  -> nearest unpaid checkout customer
  -> CASH payment event / dashboard log
```

## Level 1

Level 1 is available immediately in the browser.

It uses:
- the configured `checkout` zone;
- rectangular/aspect-ratio candidate windows;
- brightness/texture/edge statistics;
- temporal confirmation across consecutive frames;
- a cooldown so one note does not create repeated events.

Level 1 is a **cash-like visual detector**, not a banknote classifier. It is therefore expected to produce false positives in some checkout environments.

## Level 2

Level 2 uses TensorFlow.js and a project-specific trained model.

The application loads:

`/models/cash/model.json`

The model contract is deliberately small:

- input: RGB image tensor resized to `224 x 224`, values in `[0,1]`;
- output: one tensor containing five values:

```text
[presenceConfidence, centerX, centerY, width, height]
```

The four box coordinates are normalized to `0..1` inside the checkout crop.

A Level 2 detection is accepted after consecutive-frame confirmation and a confidence threshold.

## Training data required for Level 2

Use footage from the **actual checkout camera position** whenever possible.

Positive samples should include:
- single note;
- several notes;
- partially covered notes;
- different orientations;
- different lighting;
- notes held by a hand;
- notes on the counter;
- notes moving toward/away from the cashier.

Negative samples should include:
- hands without cash;
- cards;
- phones;
- receipts;
- wallets;
- paper packaging;
- empty checkout counter;
- coins if coins are not part of the detection requirement.

Bounding boxes should surround the visible cash-note region.

Do not train the model to infer denomination or authenticity for this feature.

## Production recommendation

Run Level 2 as the primary detector when a trained model is available, while retaining Level 1 as a fallback/secondary signal. The dashboard records the detection level so testing can compare the two systems.

A detection should be treated as an observation requiring normal payment workflow confirmation, not as proof that a customer completed or failed payment.
