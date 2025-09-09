## Bot-ChatAi-System
## Running 
```bash
node index.js
```
```bash
npm install
```
## Configure your bot in config.json:

```bash
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "EmbedColor": "#00ff00",
  "ErrorColor": "#ff0000",
  "setStatus": "online",
  "setActivity": "with AI and Images",
  "OwnerID": "YOUR_DISCORD_ID",
  "SupportServer": "https://discord.gg/your-support-server",
  "FeedBackChannelID": "YOUR_FEEDBACK_CHANNEL_ID"
}
```
## 📖 Commands
## 🎨 Image
/image generate <prompt> → Generate an image from text.
## 💬 Channel
/channel ai set/remove <#channel> → Set or remove AI chat channels.

/channel imagine set/remove <#channel> → Set or remove image generation channels.

/channel imagine setting → View imagine channel settings.

/channel setting view → View AI channel settings.
## 🤖 Bot
/bot ping → Show bot latency.

/bot uptime → Show uptime.

/bot info → Show bot info.

/bot stats → Show bot statistics.

/bot help → List available commands.

/bot invite → Get bot invite link.

/bot support → Get support server link.

/bot vote → Get voting link.
/bot feedback <message> → Send feedback.

/bot leave <serverid> → Force bot to leave a server (owner only).

/bot serverlist → List servers the bot is in (owner only).

/bot changelogs set/remove <#channel> → Manage changelog channels (owner only).
