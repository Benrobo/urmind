# Setting Up Gemini Nano for Offline Mode

UrMind supports **offline mode** using Google's Gemini Nano model that runs directly in your browser. This gives you AI-powered search even without an internet connection.

## Prerequisites

- Chrome Dev or Chrome Canary (v128 or later)
- At least 22GB of free disk space (for model download)

## Enable Gemini Nano

### Step 1: Enable the On-Device Model

1. Open Chrome and navigate to: `chrome://flags/#optimization-guide-on-device-model`
2. Select **"Enabled BypassPerfRequirement"**
   - This bypasses performance checks that might prevent Gemini Nano download
3. **Do not relaunch yet**

### Step 2: Enable Prompt API

1. Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
2. Select **"Enabled"**
3. Navigate to: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
4. Select **"Enabled"**
5. **Relaunch Chrome**

### Step 3: Verify Installation

1. Open DevTools (F12)
2. Go to Console
3. Run: `await LanguageModel.availability();`
4. If successful, you should see model availability status

## Configure UrMind for Offline Mode

1. Click the UrMind extension icon
2. Go to **Generation Mode** settings
3. Select **"Offline Mode"** to use Gemini Nano
4. Select **"Online Mode"** to use Gemini 2.5 Flash for maximum accuracy

## Troubleshooting

**Model not downloading?**

- Ensure you have sufficient disk space (22GB+)
- Check Chrome version (must be Dev/Canary 128+)
- Wait 5-10 minutes after enabling flags

**Still not working?**

- Try navigating to: `chrome://components/`
- Look for "Optimization Guide On Device Model"
- Click "Check for update"

## Performance Notes

- **Offline Mode (Gemini Nano)**: Faster response, works offline, private (no data leaves your device)
- **Online Mode (Gemini 2.5 Flash)**: More accurate, handles complex queries, requires internet

Choose based on your privacy needs and connectivity!
