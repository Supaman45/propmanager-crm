# Google OAuth Setup Instructions

To enable Google sign-in in your Supabase project, follow these steps:

## 1. Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click to enable it
4. You'll need to provide:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

## 2. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Replace `<your-project-ref>` with your Supabase project reference
7. Copy the **Client ID** and **Client Secret**

## 3. Configure Redirect URL in Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your site URL (e.g., `http://localhost:5173` for development or your production URL)
3. Add the redirect URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 4. Test the Integration

1. Start your application
2. Click "Continue with Google" on the login page
3. You should be redirected to Google for authentication
4. After signing in, you'll be redirected back to your app
5. The app should automatically log you in and load your data

## Notes

- The redirect URL in the code is set to `${window.location.origin}` which will automatically use your current domain
- Make sure your Supabase project has the correct redirect URLs configured
- For local development, use `http://localhost:5173` (or your Vite dev server port)
- For production, use your actual domain URL
