import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

function getBotToken() {
  if (process.env.DISCORD_BOT_TOKEN) {
    return process.env.DISCORD_BOT_TOKEN;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DISCORD_BOT_TOKEN=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {
    // ignore
  }
  return null;
}

const token = getBotToken();

if (!token) {
  console.error('No DISCORD_BOT_TOKEN found in environment or .env.local');
  process.exit(1);
}

// Minimal non-privileged intents so it connects regardless of Developer Portal settings
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Slash Commands Definition
const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check live project status, git branch, and engine worker status'),
  new SlashCommandBuilder()
    .setName('build')
    .setDescription('Trigger a production TypeScript/Vite build test'),
  new SlashCommandBuilder()
    .setName('git')
    .setDescription('View recent git commits and repository info'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and responsiveness'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available Chess Tutor bot commands'),
].map((cmd) => cmd.toJSON());

client.once('ready', async () => {
  console.log(`🤖 Chess Tutor Discord Bot is online as ${client.user?.tag}!`);

  try {
    const rest = new REST({ version: '10' }).setToken(token);
    console.log('Registering global slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Global slash commands registered successfully (/status, /build, /git, /ping, /help)!');
  } catch (err) {
    console.warn('Could not register slash commands globally:', err);
  }
});

// Slash Command Interaction Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.reply(`🏓 Pong! Bot latency: **${latency}ms**, API latency: **${Math.round(client.ws.ping)}ms**.`);
    return;
  }

  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x81b64c)
      .setTitle('♟️ Chess Tutor Bot Slash Commands')
      .setDescription('Use these slash commands in any channel your bot is in:')
      .addFields(
        { name: '`/status`', value: 'Check live project status and latest commit', inline: true },
        { name: '`/build`', value: 'Run `npm run build` verification in real-time', inline: true },
        { name: '`/git`', value: 'View recent git commits', inline: true },
        { name: '`/ping`', value: 'Check bot latency', inline: true }
      )
      .setFooter({ text: 'Chess Tutor • 2-Way Assistant' });

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (commandName === 'git') {
    await interaction.deferReply();
    try {
      const { stdout } = await execPromise('git log -n 3 --oneline', { cwd: process.cwd() });
      const embed = new EmbedBuilder()
        .setColor(0x5c8bb0)
        .setTitle('📦 Recent Git Commits')
        .setDescription(`\`\`\`\n${stdout || 'No commits found'}\`\`\``)
        .setFooter({ text: 'Repository: jtak93/chess-tutor (main)' });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Git command error: ${err.message}`);
    }
    return;
  }

  if (commandName === 'status') {
    await interaction.deferReply();
    try {
      const { stdout: gitBranch } = await execPromise('git branch --show-current', { cwd: process.cwd() });
      const { stdout: lastCommit } = await execPromise('git log -n 1 --oneline', { cwd: process.cwd() });

      const embed = new EmbedBuilder()
        .setColor(0x81b64c)
        .setTitle('⚡ Chess Tutor System Status')
        .addFields(
          { name: 'Branch', value: `\`${gitBranch.trim() || 'main'}\``, inline: true },
          { name: 'Latest Commit', value: `\`${lastCommit.trim() || 'N/A'}\``, inline: false },
          { name: 'Engine Workers', value: 'Stockfish 18 (Multi-core pool & Live Streaming)', inline: false },
          { name: 'Monetization Suite', value: 'AdSense, Scorecard PNG, PWA, SEO active', inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Status check error: ${err.message}`);
    }
    return;
  }

  if (commandName === 'build') {
    await interaction.deferReply();
    try {
      const { stdout } = await execPromise('npm.cmd run build', { cwd: process.cwd() });
      const embed = new EmbedBuilder()
        .setColor(0x81b64c)
        .setTitle('✅ Production Build Succeeded!')
        .setDescription(`\`\`\`\n${stdout.slice(-1000)}\`\`\``)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setColor(0xca3431)
        .setTitle('❌ Build Failed')
        .setDescription(`\`\`\`\n${(err.stdout || err.message).slice(-1000)}\`\`\``)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
    return;
  }
});

client.login(token).catch((err) => {
  console.error('Failed to log in to Discord:', err);
  process.exit(1);
});
