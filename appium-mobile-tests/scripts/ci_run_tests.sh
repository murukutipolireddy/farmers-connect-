#!/usr/bin/env bash
set -e

echo "📱 Starting AgriMart Mobile Appium CI Runner..."

# Inject GITHUB_PATH into PATH if available
if [ -n "$GITHUB_PATH" ] && [ -f "$GITHUB_PATH" ]; then
  export PATH="$(cat "$GITHUB_PATH" | tr '\n' ':')$PATH"
fi

APK_PATH="../android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
  echo "📦 Installing APK onto emulator: $APK_PATH"
  adb install -r "$APK_PATH" || true
else
  echo "⚠️ APK not found at $APK_PATH, continuing test suite execution..."
fi

# Run the 1,111 Mobile E2E Test Suite and Generate Excel + HTML Analysis
echo "🚀 Executing 1,111 Mobile Appium Tests & Excel Analysis..."
node scripts/run_appium_tests.js

echo "✅ Appium Mobile Tests and Excel Analysis completed successfully."
