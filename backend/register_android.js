const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

async function main() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
  });

  const client = await auth.getClient();
  const projectId = serviceAccount.project_id;
  const appId = '1:419857452747:android:419d2b7f0ef35dba42154e';

  console.log('Adding SHA-256 fingerprint to app:', appId);
  try {
    const sha256Res = await client.request({
      method: 'POST',
      url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/sha`,
      data: {
        shaHash: '7EE169A9A82F38C5138E660FAFAAF9A34F204F57660E3C31C678C45F5FA8DA12',
        certType: 'SHA_256',
      },
    });
    console.log('SHA-256 added successfully:', sha256Res.data);
  } catch (err) {
    console.log('SHA-256 result:', err.response?.data || err.message);
  }

  // Refresh google-services.json
  const configRes = await client.request({
    url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/config`,
  });
  const configFile = configRes.data.configFileContents;
  if (configFile) {
    const decoded = Buffer.from(configFile, 'base64').toString('utf8');
    const fs = require('fs');
    const path = require('path');
    const outPath = path.resolve(__dirname, '../android/app/google-services.json');
    fs.writeFileSync(outPath, decoded);
    console.log('Successfully refreshed google-services.json to:', outPath);
  }
}

main();
