# WhatsApp Activation Checklist

Steps to activate WhatsApp as the primary channel once Meta Business verification is approved.

## Prerequisites

- [ ] Meta Business verification approved (check Meta Business Suite)
- [ ] Twilio WhatsApp Business number (+85292906498) shows as "approved" in Twilio console
- [ ] Message templates approved in Twilio Content Editor (see below)

## Step 1: Create WhatsApp Message Templates

WhatsApp Business API requires pre-approved templates for business-initiated messages. Create these in Twilio Console > Messaging > Content Editor:

### OTP Template
- **Name**: `rgs_auction_otp`
- **Category**: Authentication
- **Body**: `Your RGS-HK Auction verification code is: {{1}}. This code expires in 15 minutes.`

### Outbid Notification
- **Name**: `rgs_auction_outbid`
- **Category**: Utility
- **Body**: `Hi {{1}}, you've been outbid on "{{2}}"! New highest bid: {{3}}. Place a higher bid: {{4}}`

### Winner Notification
- **Name**: `rgs_auction_winner`
- **Category**: Utility
- **Body**: `Congratulations {{1}}! You won "{{2}}" with a winning bid of {{3}}. Our team will contact you about collection. Thank you for supporting RGS-HK!`

## Step 2: Update Schema Defaults

In `prisma/schema.prisma`, change:

```prisma
notificationPref NotificationChannel @default(WHATSAPP)  // was EMAIL
emailOptIn       Boolean @default(false)                   // was true
whatsappOptIn    Boolean @default(true)                    // was false
```

Then run:
```bash
npx prisma db push
```

## Step 3: Update Registration Flow

In `src/app/api/auth/register/route.ts`:
- The `sendVerificationCode()` function already tries email first, then WhatsApp
- To make WhatsApp primary, swap the order: try WhatsApp first, fall back to email

In `src/app/register/page.tsx`:
- Update phone hint to "We'll send a verification code via WhatsApp"
- Consider making email optional again (remove "Recommended" hint)

## Step 4: Update Login Default

In `src/app/login/page.tsx`:
- Change `useState<LoginMethod>('email')` to `useState<LoginMethod>('phone')`
- This makes WhatsApp OTP the default login method

## Step 5: Update OTP to Use Templates

In `src/app/api/auth/otp/send/route.ts`:
- Replace freeform `body` with `contentSid` and `contentVariables`
- Example:
  ```typescript
  await client.messages.create({
    contentSid: 'HXXXXXXXXXXX',  // Template SID from Twilio
    contentVariables: JSON.stringify({ 1: otp }),
    from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phone}`,
  })
  ```

## Step 6: Update Notifications to Use Templates

In `src/lib/notifications/index.ts`:
- Update `sendWhatsApp()` to use ContentSid + ContentVariables instead of freeform body
- Map notification types to template names:
  - OUTBID → `rgs_auction_outbid`
  - WON → `rgs_auction_winner`

## Step 7: Bulk Update Existing Bidders (Optional)

If you want existing bidders to receive WhatsApp notifications:

```sql
UPDATE "Bidder"
SET "notificationPref" = 'WHATSAPP',
    "whatsappOptIn" = true
WHERE "phoneVerified" = true;
```

## Step 8: Environment Variables

Ensure these are set in Vercel for all environments:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER=+85292906498`

## Step 9: Test End-to-End

1. Register with phone → receive WhatsApp OTP → verify
2. Login with phone → WhatsApp OTP → verify
3. Place bid → get outbid → receive WhatsApp notification with deep link
4. Win prize → receive WhatsApp winner notification
5. Click deep link in WhatsApp → opens bid page with bid sheet

## Rollback

If issues arise, revert to email by:
1. Change schema defaults back to EMAIL
2. Change login default back to `'email'`
3. Deploy — the notification fallback chain will automatically route to email
