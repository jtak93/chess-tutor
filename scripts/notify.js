import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function getWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) {
    return process.env.DISCORD_WEBHOOK_URL;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DISCORD_WEBHOOK_URL=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {
    // ignore
  }
  return 'https://discord.com/api/webhooks/1551758645253898403/iDe_FuEazoWMuVmmh9w-qwgahvZxmDb_ZZBI1fEsu-rekSdztof1tcNAd230wdbshKwL';
}

export async function sendDiscordNotification(title, message, type = 'info') {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return;

  const colorMap = {
    decision: 0xe6912c, // Amber/Orange
    success: 0x81b64c,  // Chess Emerald Green
    info: 0x5c8bb0,     // Blue
    warning: 0xca3431,  // Red
  };

  const payload = {
    username: 'Chess Tutor Bot ♟️',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/3039/3039433.png',
    embeds: [
      {
        title: title,
        description: message,
        color: colorMap[type] || colorMap.info,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Chess Tutor Agent • Notification Service',
        },
      },
    ],
  };

  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode);
    });

    req.on('error', (e) => {
      console.error('Discord notify error:', e.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Allow CLI execution: node scripts/notify.js "Title" "Message" "type"
const args = process.argv.slice(2);
if (args.length > 0) {
  const title = args[0] || 'Chess Tutor Notification';
  const msg = args[1] || 'Status update';
  const type = args[2] || 'info';
  sendDiscordNotification(title, msg, type).then((code) => {
    console.log(`Notification sent (status: ${code})`);
  });
}
