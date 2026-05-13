# AI Audit - Week 10 Day 1

## Money code audit

The following files contain code related to payments, amounts, or validation. All lines were written manually by me, not copied from AI.

| File         | Lines that touch money/amounts                  | Author        |
| ------------ | ----------------------------------------------- | ------------- |
| index.js     | None (only /health endpoint)                    | Makkah Ismael |
| .env.example | No code, just environment variable placeholders | Makkah Ismael |

## Notes

- No AI was used to write Express routes, validation logic, or any code that will handle payment amounts.
- Day 2 will add STK push and callback handling; those will also be hand‑written and audited.

## Declaration

I confirm that every line of code in this project that processes, validates, or stores monetary values was written by me, without AI generation.

## Day 2 – M-Pesa STK Push

### Money code audit

The following files contain code that handles payments, amounts, or transaction validation. All lines were written manually by me.

| File              | Lines that touch money/amounts                                                         | Author        |
| ----------------- | -------------------------------------------------------------------------------------- | ------------- |
| services/mpesa.js | getToken(), initiateStkPush() – token exchange, STK payload construction, amount field | Makkah Ismael |
| index.js          | /mpesa/stk route – amount validation (line with `amount < 1`, `amount > 150000`)       | Makkah Ismael |
| index.js          | /mpesa/callback route – ResultCode check, amount extraction from metadata              | Makkah Ismael |

### Declaration

I confirm that every line of code that processes, validates, or stores monetary values in Day 2 was written by me, without AI generation.

## Day 3 – React Frontend and PDF Receipts

### Money code audit

| File                             | Lines that touch money/amounts                           | Author      |
| -------------------------------- | -------------------------------------------------------- | ----------- |
| services/receipt.js              | `Amount: KES ${amount}` – hand-written                   | [Your Name] |
| services/mpesa.js (unchanged)    | token exchange, STK payload                              | [Your Name] |
| Frontend PayForm.jsx (if exists) | amount validation frontend? Not used – backend validates | [Your Name] |

### Declaration

The receipt generation code that writes the amount was typed by me without AI assistance. The React UI patterns (forms, state, polling) are standard React patterns and may have been AI‑assisted, but all payment‑critical logic (amount display, API calls) was manually written.
