import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Google OAuth 2.0 Popup Authorization URL endpoint
  app.get("/api/auth/google/url", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || "";
    const origin = (typeof req.query.origin === "string" && req.query.origin) || process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin.replace(/\/$/, "")}/auth/callback`;

    if (!clientId) {
      res.json({ configured: false, redirectUri });
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
      state: encodeURIComponent(redirectUri),
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ configured: true, url, redirectUri });
  });

  // Google OAuth 2.0 Popup Callback handler
  app.get(["/auth/callback", "/auth/callback/"], async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || "";
    const redirectUri = state
      ? decodeURIComponent(state)
      : `${(process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")}/auth/callback`;

    if (!code || !clientId || !clientSecret) {
      res.status(400).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 32px; text-align: center;">
            <h3>Google OAuth Configuration Pending</h3>
            <p>Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment settings.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Missing Google OAuth credentials' }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </body>
        </html>
      `);
      return;
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to exchange Google OAuth code");
      }

      const tokenData = (await tokenRes.json()) as { access_token: string };
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!profileRes.ok) {
        throw new Error("Failed to fetch Google user profile");
      }

      const profile = (await profileRes.json()) as { id: string; email?: string; name?: string };
      const email = (profile.email || `google_${profile.id}@gmail.com`).toLowerCase().trim();
      const name = profile.name || email.split("@")[0];
      const openId = `google:${email}`;

      const existing = await db.getUserByEmail(email);
      const finalOpenId = existing?.openId || openId;

      await db.upsertUser({
        openId: finalOpenId,
        name,
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(finalOpenId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.send(`
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 32px; text-align: center;">
            <p>Signed in with Google. Closing window…</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: ${JSON.stringify(sessionToken)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 32px; text-align: center;">
            <p>Google Sign-In could not be completed. Please close this window and try again.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Google OAuth callback failed' }, '*');
                setTimeout(() => window.close(), 1800);
              }
            </script>
          </body>
        </html>
      `);
    }
  });
}
