# MUST Connect — Build APK Using Websites Only
## No command line needed. All done through GitHub, Expo, and EAS websites.

---

# PART 1 — SET UP YOUR ACCOUNTS (5 minutes)

## Step 1 — Create an Expo Account
1. Go to **https://expo.dev**
2. Click **Sign Up** (top right)
3. Fill in your details and create account
4. Verify your email
5. Note down your **username** — you will need it

## Step 2 — Create a GitHub Account (if you don't have one)
1. Go to **https://github.com**
2. Click **Sign up**
3. Create your account and verify email

---

# PART 2 — CREATE YOUR GITHUB REPOSITORY (5 minutes)

## Step 3 — Create a new GitHub Repository
1. Log into **https://github.com**
2. Click the **+** button (top right) → **New repository**
3. Repository name: `must-connect`
4. Set to **Private** (important — keeps your Supabase keys safe)
5. Check ✅ **Add a README file**
6. Click **Create repository**

## Step 4 — Upload all project files
Your repository needs these files exactly. Upload them one by one:

1. In your new repository, click **Add file** → **Upload files**
2. Upload ALL these files from the ZIP:
   ```
   App.js
   app.json
   package.json
   eas.json
   babel.config.js
   metro.config.js
   .gitignore
   ```
3. Click **Commit changes**

## Step 5 — Upload the assets folder
1. Click **Add file** → **Create new file**
2. In the filename box, type: `assets/placeholder.txt`
3. In the content box, type: `assets folder`
4. Click **Commit new file**
5. Now go to the `assets` folder you just created
6. Click **Add file** → **Upload files**
7. Upload these 4 files:
   - `app.html` (the full MUST Connect app)
   - `icon.png`
   - `adaptive-icon.png`
   - `splash.png`
8. Click **Commit changes**

---

# PART 3 — CONNECT EXPO TO GITHUB (5 minutes)

## Step 6 — Link your repo to Expo
1. Go to **https://expo.dev** and log in
2. Click **Create a project** (or **New Project**)
3. Choose **Import from GitHub**
4. Click **Connect GitHub** → authorize Expo to access your GitHub
5. Select your `must-connect` repository
6. Project name: `MUST Connect`
7. Click **Create project**

## Step 7 — Get your EAS Project ID
1. After creating, you'll see your project dashboard
2. Find the **Project ID** — it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. Copy it

## Step 8 — Update app.json with your details
1. Go back to your GitHub repository
2. Click on `app.json`
3. Click the ✏️ pencil (edit) icon
4. Find these two lines:
   ```
   "projectId": "REPLACE_WITH_YOUR_EAS_PROJECT_ID"
   "owner": "REPLACE_WITH_YOUR_EXPO_USERNAME"
   ```
5. Replace with your actual values:
   ```
   "projectId": "paste-your-project-id-here"
   "owner": "your-expo-username"
   ```
6. Scroll down → click **Commit changes**

---

# PART 4 — BUILD YOUR APK (10-15 minutes)

## Step 9 — Start a Build on EAS
1. Go to **https://expo.dev** → your project
2. Click **Builds** in the left sidebar
3. Click **New build**
4. Select:
   - Platform: **Android**
   - Build profile: **preview** (this creates an APK file)
5. Click **Build**
6. Wait 10-15 minutes — you'll see live build logs
7. When it says ✅ **Build finished**, click **Download**
8. You get a `.apk` file

---

# PART 5 — INSTALL ON YOUR ANDROID PHONE

## Step 10 — Install the APK
1. Send the `.apk` file to your phone (WhatsApp, Google Drive, email, USB)
2. On your Android phone, go to:
   - **Settings → Security** (or Privacy)
   - Turn on **Install unknown apps** or **Unknown sources**
   - Some phones: Settings → Apps → Special app access → Install unknown apps → allow your file manager or browser
3. Open your phone's **File Manager**
4. Find the `.apk` file → tap it
5. Tap **Install**
6. Open **MUST Connect** from your app drawer 🎉

---

# PART 6 — UPDATING THE APP

When you make changes (new features, bug fixes):

## Update the app.html file
1. Go to your GitHub repository
2. Click on `assets/` folder → click `app.html`
3. Click the ✏️ pencil (edit) icon
4. Make your changes
5. Click **Commit changes**

## Rebuild the APK
1. Go to expo.dev → your project → Builds
2. Click **New build** → Android → preview → Build
3. Download the new APK and install it (reinstall over the old one)

### Update app version number (optional but recommended)
In `app.json`, increase `"versionCode"` by 1 each time:
```
"versionCode": 2   (was 1)
```

---

# PART 7 — SUPABASE KEYS IN THE APK

**Important:** Your Supabase keys are inside `app.html`. Since your GitHub repository is **Private**, no one else can see them.

However, technically anyone with the APK can extract the HTML and see the keys. This is acceptable for now because:
- Supabase Row Level Security (RLS) protects all data even with the anon key
- The anon key is meant to be public — it's not a secret
- Only your real service key (never in the app) is sensitive

For maximum security later, you can move the API calls to Supabase Edge Functions.

---

# TROUBLESHOOTING

## "Build failed" on EAS
- Check the build logs — scroll down to find the red error
- Most common: missing file or wrong `package.json` version
- Make sure ALL files are uploaded to GitHub

## App shows white screen
- The `app.html` may not have loaded
- Make sure `assets/app.html` exists in your GitHub repo
- Check the filename is exactly `app.html` (lowercase)

## "Unknown sources" option missing on phone
- Samsung: Settings → Biometrics and security → Install unknown apps
- Xiaomi: Settings → Additional settings → Privacy → Unknown sources
- OnePlus: Settings → Security → Install unknown apps

## App crashes on open
- Your phone may need Android 7.0 or higher
- Check: Settings → About phone → Android version

---

# WANT TO PUBLISH TO GOOGLE PLAY STORE?

When you're ready to distribute to all MUST students via Play Store:

1. Change build profile from `preview` to `production` in EAS
2. Production builds create an `.aab` (Android App Bundle) file
3. Create a Google Play Developer account at **https://play.google.com/console**
   - One-time fee: **$25 USD**
4. Create a new app → upload the `.aab` file
5. Fill in store listing: description, screenshots, category (Education)
6. Submit for review (takes 1-3 days)

---

# FILES SUMMARY

| File | What it does |
|------|-------------|
| `App.js` | React Native wrapper with WebView, image picker, keyboard fixes |
| `app.json` | App name, icon, permissions, Android settings |
| `package.json` | Dependencies list (React Native, Expo, WebView) |
| `eas.json` | Build profiles (APK for testing, AAB for Play Store) |
| `metro.config.js` | Tells the bundler to treat .html as an asset |
| `babel.config.js` | JavaScript transpiler config |
| `assets/app.html` | Your complete MUST Connect app (Supabase + all features) |
| `assets/icon.png` | App icon (1024×1024) |
| `assets/adaptive-icon.png` | Android adaptive icon |
| `assets/splash.png` | Splash screen |
