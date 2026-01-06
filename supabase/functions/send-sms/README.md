# Send SMS Edge Function

This Supabase Edge Function handles sending SMS messages via Twilio API securely without exposing credentials in the frontend.

## Setup

1. **Deploy the function to Supabase:**
   ```bash
   supabase functions deploy send-sms
   ```

2. **Set environment variables (optional):**
   The function can work with credentials passed from the frontend, but for better security, you can set them as environment variables:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   ```

3. **Update the function to use environment variables (optional):**
   If you want to use environment variables instead of passing credentials from the frontend, modify `index.ts` to read from `Deno.env.get('TWILIO_ACCOUNT_SID')` etc.

## Usage

The function expects a POST request with the following body:
```json
{
  "to": "+1234567890",
  "message": "Your message here",
  "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "authToken": "your_auth_token",
  "fromNumber": "+1234567890",
  "tenantId": 123,  // optional, for logging
  "userId": "uuid"  // optional, for logging
}
```

## Response

Success response:
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message"
}
```
