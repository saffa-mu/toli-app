# Toli (app)

**Har shehar mein apni toli.** Meet people who share your interests at the places you already go, and like-minded strangers who visit them, through verified profiles, small group plans and safety built in.

This is the product-style version of the Toli prototype: no presenter panel, beats or timers. The demo version lives in the `toli-poc` repo.

All people, places and chats are simulated. There is no backend: your data stays in this browser (local storage). No real SMS, GPS, camera or payments are used.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm test
```

## Using it

- Sign up (the OTP is `123456`; "Demo autofill" fills a step), then follow the recommendations.
- **Me → Time and testing tools** skips the simulated clock ahead (an hour, a day, Saturday 6:30 am) so you can try second check-ins, "I'm here" and meet-again without waiting days, and resets the app.
- **Me → Founder dashboard** shows the metrics, partner (B2B) leads and venue table.
- Verification score, levels and the 100 km radius are described in the app under Home → Boost.

Percentages and thresholds are proposed values, not tested ones.
