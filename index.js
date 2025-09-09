
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const config = require('./config.json');

// Store AI channels for each server
let aiChannels = {};
let imagineChannels = {};

// Store bot start time and changelog channels
const botStartTime = Date.now();
let changelogChannels = {};

// Load existing AI channels data
if (fs.existsSync('ai-channels.json')) {
    try {
        const data = JSON.parse(fs.readFileSync('ai-channels.json', 'utf8'));
        aiChannels = data.aiChannels || data;
        imagineChannels = data.imagineChannels || {};
    } catch (error) {
        console.log('Error loading AI channels data:', error);
    }
}

// Load existing changelog channels data
if (fs.existsSync('changelogs.json')) {
    try {
        const data = JSON.parse(fs.readFileSync('changelogs.json', 'utf8'));
        changelogChannels = data.changelogChannels || {};
    } catch (error) {
        console.log('Error loading changelog channels data:', error);
    }
}

// Save AI channels data
function saveAIChannels() {
    fs.writeFileSync('ai-channels.json', JSON.stringify({
        aiChannels: aiChannels,
        imagineChannels: imagineChannels
    }, null, 2));
}

// Save changelog channels data
function saveChangelogChannels() {
    fs.writeFileSync('changelogs.json', JSON.stringify({
        changelogChannels: changelogChannels
    }, null, 2));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('image')
        .setDescription('Generate images')
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('Generate an image from a prompt')
                .addStringOption(option =>
                    option
                        .setName('prompt')
                        .setDescription('The prompt to generate an image from')
                        .setRequired(true)
                )
        ),
    new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Manage AI channels')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('ai')
                .setDescription('AI channel management')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set a channel for AI chat')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('The channel to set for AI chat')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove AI chat from a channel')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('The channel to remove AI chat from')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('imagine')
                .setDescription('Imagine (image generation) channel management')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set a channel for image generation')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('The channel to set for image generation')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove image generation from a channel')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('The channel to remove image generation from')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('setting')
                        .setDescription('View current imagine channel settings')
                )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('setting')
                .setDescription('View settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('view')
                        .setDescription('View current AI channel settings')
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('uptime')
                .setDescription('Show bot uptime')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping')
                .setDescription('Show bot ping')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show bot information')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show bot statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Show bot help')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Get bot invite link')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Make bot leave a server (Owner only)')
                .addStringOption(option =>
                    option
                        .setName('serverid')
                        .setDescription('Server ID to leave')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('serverlist')
                .setDescription('Show server list (Owner only)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('support')
                .setDescription('Get support server link')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('vote')
                .setDescription('Vote for the bot')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('feedback')
                .setDescription('Send feedback to the developers')
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Your feedback message')
                        .setRequired(true)
                )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('changelogs')
                .setDescription('Changelog channel management (Owner only)')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set changelog channel (Owner only)')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Channel to send changelogs to')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove changelog channel (Owner only)')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Channel to remove from changelogs')
                                .setRequired(true)
                        )
                )
        )
];

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set bot status and activity
    client.user.setStatus(config.setStatus);
    client.user.setActivity(config.setActivity, { type: ActivityType.Playing });
    
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Check if command is used in DMs
    if (!interaction.guild) {
        const dmEmbed = new EmbedBuilder()
            .setColor(config.ErrorColor)
            .setTitle('❌ DM Not Supported')
            .setDescription('Cannot use command in DM. This bot only works in servers.');
        
        return interaction.reply({ embeds: [dmEmbed], ephemeral: true });
    }

    const { commandName, options } = interaction;

    if (commandName === 'image') {
        const subcommand = options.getSubcommand();

        if (subcommand === 'generate') {
            const prompt = options.getString('prompt');

            // Check bot permissions
            const botMember = interaction.guild?.members?.me;
            if (!botMember) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Guild Error')
                    .setDescription('Unable to access guild information. Please try again.');
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            if (!botMember.permissions.has(PermissionFlagsBits.ViewChannel) ||
                !botMember.permissions.has(PermissionFlagsBits.SendMessages) ||
                !botMember.permissions.has(PermissionFlagsBits.AttachFiles) ||
                !botMember.permissions.has(PermissionFlagsBits.EmbedLinks)) {
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Permission Error')
                    .setDescription('I need **View Channel**, **Send Messages**, **Attach Files**, and **Embed Links** permissions to generate images.');
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            try {
                // Send initial processing message
                await interaction.reply({ content: 'Generating image...', fetchReply: true });

                // Get image from API
                const encodedPrompt = encodeURIComponent(prompt);
                const response = await axios.get(`https://bucu-api.vercel.app/image?prompt=${encodedPrompt}`, {
                    headers: {
                        'x-api-key': 'bucu'
                    },
                    timeout: 60000
                });

                const result = response.data;

                const embed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle(result.message || 'Image Generated')
                    .setDescription(`**Prompt:** \`${prompt}\`\n**Success:** \`${result.success}\``)
                    .setImage(result.image)
                    .setTimestamp()
                    .setFooter({ 
                        text: `Requested by ${interaction.user.username}`, 
                        iconURL: interaction.user.displayAvatarURL() 
                    });

                await interaction.editReply({ content: '', embeds: [embed] });

            } catch (error) {
                console.error('Error generating image:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Image Generation Error')
                    .setDescription('Sorry, I encountered an error while generating the image. Please try again later.')
                    .setTimestamp();

                await interaction.editReply({ content: '', embeds: [errorEmbed] });
            }
        }
    } else if (commandName === 'channel') {
        const subcommandGroup = options.getSubcommandGroup();
        const subcommand = options.getSubcommand();

        // Check permissions
        if (!interaction.member || 
            !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
            !interaction.member.permissions.has(PermissionFlagsBits.ViewChannel) ||
            !interaction.member.permissions.has(PermissionFlagsBits.SendMessages)) {
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle('❌ Permission Error')
                .setDescription('You need **Manage Channels**, **View Channel**, and **Send Messages** permissions to use this command.');
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const guildId = interaction.guild.id;

        if (subcommandGroup === 'ai') {
            const channel = options.getChannel('channel');

            if (subcommand === 'set') {
                // Initialize guild data if not exists
                if (!aiChannels[guildId]) {
                    aiChannels[guildId] = [];
                }

                // Check if channel is already added
                if (aiChannels[guildId].includes(channel.id)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(config.ErrorColor)
                        .setTitle('❌ Already Set')
                        .setDescription(`Channel ${channel} is already set for AI chat.`);
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Add channel to AI channels
                aiChannels[guildId].push(channel.id);
                saveAIChannels();

                const successEmbed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('✅ AI Channel Set')
                    .setDescription(`Channel ${channel} has been set for AI chat.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed] });

            } else if (subcommand === 'remove') {
                if (!aiChannels[guildId] || !aiChannels[guildId].includes(channel.id)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(config.ErrorColor)
                        .setTitle('❌ Not Found')
                        .setDescription(`Channel ${channel} is not set for AI chat.`);
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Remove channel from AI channels
                aiChannels[guildId] = aiChannels[guildId].filter(id => id !== channel.id);
                saveAIChannels();

                const successEmbed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('✅ AI Channel Removed')
                    .setDescription(`Channel ${channel} has been removed from AI chat.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed] });
            }

        } else if (subcommandGroup === 'imagine') {
            const channel = options.getChannel('channel');

            if (subcommand === 'set') {
                // Initialize guild data if not exists
                if (!imagineChannels[guildId]) {
                    imagineChannels[guildId] = [];
                }

                // Check if channel is already added
                if (imagineChannels[guildId].includes(channel.id)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(config.ErrorColor)
                        .setTitle('❌ Already Set')
                        .setDescription(`Channel ${channel} is already set for image generation.`);
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Add channel to imagine channels
                imagineChannels[guildId].push(channel.id);
                saveAIChannels();

                const successEmbed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('✅ Imagine Channel Set')
                    .setDescription(`Channel ${channel} has been set for image generation.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed] });

            } else if (subcommand === 'remove') {
                if (!imagineChannels[guildId] || !imagineChannels[guildId].includes(channel.id)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(config.ErrorColor)
                        .setTitle('❌ Not Found')
                        .setDescription(`Channel ${channel} is not set for image generation.`);
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Remove channel from imagine channels
                imagineChannels[guildId] = imagineChannels[guildId].filter(id => id !== channel.id);
                saveAIChannels();

                const successEmbed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('✅ Imagine Channel Removed')
                    .setDescription(`Channel ${channel} has been removed from image generation.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [successEmbed] });

            } else if (subcommand === 'setting') {
                const embed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('🎨 Imagine Channel Settings')
                    .setTimestamp();

                if (!imagineChannels[guildId] || imagineChannels[guildId].length === 0) {
                    embed.setDescription('No imagine channels set in this server.');
                } else {
                    const channelList = imagineChannels[guildId]
                        .map(channelId => `<#${channelId}>`)
                        .join('\n');
                    
                    embed.setDescription(`**Imagine Channels:**\n${channelList}`);
                }

                await interaction.reply({ embeds: [embed] });
            }

        } else if (subcommandGroup === 'setting') {
            if (subcommand === 'view') {
                const embed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('🤖 AI Channel Settings')
                    .setTimestamp();

                if (!aiChannels[guildId] || aiChannels[guildId].length === 0) {
                    embed.setDescription('No AI channels set in this server.');
                } else {
                    const channelList = aiChannels[guildId]
                        .map(channelId => `<#${channelId}>`)
                        .join('\n');
                    
                    embed.setDescription(`**AI Channels:**\n${channelList}`);
                }

                await interaction.reply({ embeds: [embed] });
            }
        }
    } else if (commandName === 'bot') {
        const subcommand = options.getSubcommand();

        if (subcommand === 'ping') {
            const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
            const ping = sent.createdTimestamp - interaction.createdTimestamp;
            
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('🏓 Pong!')
                .addFields([
                    { name: 'Bot Latency', value: `${ping}ms`, inline: true },
                    { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
                ])
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [embed] });

        } else if (subcommand === 'uptime') {
            const uptime = Date.now() - botStartTime;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor(uptime / 3600000) % 24;
            const minutes = Math.floor(uptime / 60000) % 60;
            const seconds = Math.floor(uptime / 1000) % 60;

            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('⏰ Bot Uptime')
                .setDescription(`${days}d ${hours}h ${minutes}m ${seconds}s`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'info') {
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('🤖 Bot Information')
                .addFields([
                    { name: 'Bot Name', value: client.user.tag, inline: true },
                    { name: 'Bot ID', value: client.user.id, inline: true },
                    { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
                    { name: 'Users', value: client.users.cache.size.toString(), inline: true },
                    { name: 'Channels', value: client.channels.cache.size.toString(), inline: true },
                    { name: 'Node.js', value: process.version, inline: true }
                ])
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'stats') {
            const totalAIChannels = Object.values(aiChannels).reduce((acc, channels) => acc + channels.length, 0);
            const totalImagineChannels = Object.values(imagineChannels).reduce((acc, channels) => acc + channels.length, 0);

            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('📊 Bot Statistics')
                .addFields([
                    { name: 'Total Servers', value: client.guilds.cache.size.toString(), inline: true },
                    { name: 'Total Users', value: client.users.cache.size.toString(), inline: true },
                    { name: 'Total Channels', value: client.channels.cache.size.toString(), inline: true },
                    { name: 'AI Channels', value: totalAIChannels.toString(), inline: true },
                    { name: 'Imagine Channels', value: totalImagineChannels.toString(), inline: true },
                    { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'help') {
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('📖 Bot Help')
                .setDescription('Here are all the available commands:')
                .addFields([
                    { name: '/image generate <prompt>', value: 'Generate an image from a text prompt', inline: false },
                    { name: '/channel ai set/remove <channel>', value: 'Set or remove AI chat channels', inline: false },
                    { name: '/channel imagine set/remove <channel>', value: 'Set or remove image generation channels', inline: false },
                    { name: '/channel setting view', value: 'View current channel settings', inline: false },
                    { name: '/bot ping', value: 'Check bot latency', inline: false },
                    { name: '/bot uptime', value: 'Show bot uptime', inline: false },
                    { name: '/bot info', value: 'Show bot information', inline: false },
                    { name: '/bot stats', value: 'Show bot statistics', inline: false },
                    { name: '/bot invite', value: 'Get bot invite link', inline: false },
                    { name: '/bot support', value: 'Get support server link', inline: false },
                    { name: '/bot vote', value: 'Vote for the bot', inline: false },
                    { name: '/bot feedback <message>', value: 'Send feedback to developers', inline: false }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'invite') {
            const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=388160&scope=bot%20applications.commands`;
            
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('🔗 Invite Bot')
                .setDescription(`[Click here to invite the bot to your server](${inviteLink})`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'leave') {
            // Owner only command
            if (interaction.user.id !== config.OwnerID) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Access Denied')
                    .setDescription('This command is only available to the bot owner.');
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const serverId = options.getString('serverid');
            const guild = client.guilds.cache.get(serverId);
            
            if (!guild) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Server Not Found')
                    .setDescription(`Could not find server with ID: ${serverId}`);
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            try {
                await guild.leave();
                
                const embed = new EmbedBuilder()
                    .setColor(config.EmbedColor)
                    .setTitle('✅ Left Server')
                    .setDescription(`Successfully left server: ${guild.name} (${serverId})`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('Error leaving server:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Error')
                    .setDescription('Failed to leave the server.')
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

        } else if (subcommand === 'serverlist') {
            // Owner only command
            if (interaction.user.id !== config.OwnerID) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Access Denied')
                    .setDescription('This command is only available to the bot owner.');
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const guilds = client.guilds.cache.map(guild => 
                `**${guild.name}** - ${guild.memberCount} members - ID: ${guild.id}`
            );

            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('📋 Server List')
                .setDescription(guilds.slice(0, 10).join('\n') || 'No servers found')
                .setFooter({ text: `Total: ${client.guilds.cache.size} servers` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'support') {
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('🆘 Support Server')
                .setDescription(`Need help? Join our support server!\n\n[Click here to join](${config.SupportServer})`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'vote') {
            const voteLink = `https://top.gg/bot/${client.user.id}/vote`;
            
            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle('🗳️ Vote for the Bot')
                .setDescription(`Help support the bot by voting!\n\n[Click here to vote](${voteLink})`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'feedback') {
            const feedbackMessage = options.getString('message');
            
            try {
                // Send feedback to the configured channel
                const feedbackChannel = client.channels.cache.get(config.FeedBackChannelID);
                
                if (feedbackChannel) {
                    const feedbackEmbed = new EmbedBuilder()
                        .setColor(config.EmbedColor)
                        .setTitle('📝 New Feedback')
                        .setDescription(feedbackMessage)
                        .addFields([
                            { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                            { name: 'Server', value: `${interaction.guild.name} (${interaction.guild.id})`, inline: true },
                            { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: true }
                        ])
                        .setTimestamp()
                        .setThumbnail(interaction.user.displayAvatarURL());

                    await feedbackChannel.send({ embeds: [feedbackEmbed] });
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor(config.EmbedColor)
                        .setTitle('✅ Feedback Sent')
                        .setDescription('Thank you for your feedback! It has been sent to our development team.')
                        .setTimestamp();

                    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(config.ErrorColor)
                        .setTitle('❌ Configuration Error')
                        .setDescription('Feedback channel is not properly configured. Please contact the bot owner.');

                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (error) {
                console.error('Error sending feedback:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Error')
                    .setDescription('Failed to send feedback. Please try again later.')
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

        }
    }

    // Handle subcommand groups separately
    if (commandName === 'bot') {
        const subcommandGroup = options.getSubcommandGroup();
        
        if (subcommandGroup === 'changelogs') {
            const subcommandName = options.getSubcommand();

            // Owner only command
            if (interaction.user.id !== config.OwnerID) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setTitle('❌ Access Denied')
                    .setDescription('This command is only available to the bot owner.');
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (subcommandGroup === 'changelogs') {
                const channel = options.getChannel('channel');

                if (subcommandName === 'set') {
                    changelogChannels[channel.guild.id] = {
                        channelId: channel.id,
                        guildId: channel.guild.id
                    };
                    saveChangelogChannels();

                    const embed = new EmbedBuilder()
                        .setColor(config.EmbedColor)
                        .setTitle('✅ Changelog Channel Set')
                        .setDescription(`Changelog channel has been set to ${channel}`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });

                } else if (subcommandName === 'remove') {
                    if (!changelogChannels[channel.guild.id] || changelogChannels[channel.guild.id].channelId !== channel.id) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(config.ErrorColor)
                            .setTitle('❌ Not Found')
                            .setDescription(`${channel} is not set as a changelog channel.`);
                        
                        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }

                    delete changelogChannels[channel.guild.id];
                    saveChangelogChannels();

                    const embed = new EmbedBuilder()
                        .setColor(config.EmbedColor)
                        .setTitle('✅ Changelog Channel Removed')
                        .setDescription(`Changelog channel ${channel} has been removed`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
        }
    }
});

client.on('messageCreate', async message => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if message is in a guild (not DM)
    if (!message.guild) {
        const dmEmbed = new EmbedBuilder()
            .setColor(config.ErrorColor)
            .setTitle('❌ DM Not Supported')
            .setDescription('This bot only works in servers, not in direct messages. Please use the bot in a server where it has been added.');
        
        return message.reply({ embeds: [dmEmbed] });
    }

    const guildId = message.guild.id;

    // Check if message is in an imagine channel
    if (imagineChannels[guildId] && imagineChannels[guildId].includes(message.channel.id)) {
        // Check bot permissions
        const botMember = message.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ViewChannel) ||
            !botMember.permissions.has(PermissionFlagsBits.SendMessages) ||
            !botMember.permissions.has(PermissionFlagsBits.AttachFiles) ||
            !botMember.permissions.has(PermissionFlagsBits.EmbedLinks)) {
            return;
        }

        try {
            // Send initial processing message
            const sent = await message.reply({ content: 'Generating image...', fetchReply: true });

            // Get image from API
            const encodedPrompt = encodeURIComponent(message.content);
            const response = await axios.get(`https://bucu-api.vercel.app/image?prompt=${encodedPrompt}`, {
                headers: {
                    'x-api-key': 'bucu'
                },
                timeout: 60000
            });

            const result = response.data;

            const embed = new EmbedBuilder()
                .setColor(config.EmbedColor)
                .setTitle(result.message || 'Image Generated')
                .setDescription(`**Prompt:** \`${message.content}\`\n**Success:** \`${result.success}\``)
                .setImage(result.image)
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            await sent.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('Error generating image:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle('❌ Image Generation Error')
                .setDescription('Sorry, I encountered an error while generating the image. Please try again later.')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    }
    // Check if message is in an AI channel
    else if (aiChannels[guildId] && aiChannels[guildId].includes(message.channel.id)) {
        // Check bot permissions
        const botMember = message.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ViewChannel) ||
            !botMember.permissions.has(PermissionFlagsBits.SendMessages)) {
            return;
        }

        try {
            // Send initial thinking message
            const sent = await message.reply({ content: 'Waiting...', fetchReply: true });

            // Get AI response from Pollinations API
            const response = await axios.post('https://text.pollinations.ai/', {
                messages: [
                    {
                        role: 'user',
                        content: message.content
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            let aiResponse = response.data;
            
            // Handle different response formats
            if (typeof aiResponse === 'object') {
                if (aiResponse.choices && aiResponse.choices[0]) {
                    aiResponse = aiResponse.choices[0].message?.content || JSON.stringify(aiResponse);
                } else if (aiResponse.response) {
                    aiResponse = aiResponse.response;
                } else {
                    aiResponse = JSON.stringify(aiResponse);
                }
            }

            // Split long messages
            if (aiResponse.length > 2000) {
                const chunks = aiResponse.match(/[\s\S]{1,2000}/g);
                await sent.edit(chunks[0]);
                for (let i = 1; i < chunks.length; i++) {
                    await message.reply(chunks[i]);
                }
            } else {
                await sent.edit(aiResponse);
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(config.ErrorColor)
                .setTitle('❌ AI Error')
                .setDescription('Sorry, I encountered an error while processing your request. Please try again later.')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    }
});

// Handle when bot leaves a guild
client.on('guildDelete', guild => {
    const guildId = guild.id;
    
    // Remove guild data from both AI and imagine channels
    if (aiChannels[guildId]) {
        delete aiChannels[guildId];
        console.log(`Removed AI channels data for guild: ${guildId}`);
    }
    
    if (imagineChannels[guildId]) {
        delete imagineChannels[guildId];
        console.log(`Removed imagine channels data for guild: ${guildId}`);
    }
    
    // Remove changelog channel data
    if (changelogChannels[guildId]) {
        delete changelogChannels[guildId];
        console.log(`Removed changelog channel data for guild: ${guildId}`);
    }
    
    // Save the updated data
    saveAIChannels();
    saveChangelogChannels();
    console.log(`Cleaned up data for guild: ${guild.name} (${guildId})`);
});

client.on('error', async (error) => {
    console.error(error);
    
    if (Object.keys(changelogChannels).length > 0 && error) {
        let errorMessage = error.toString();
        let stackMessage = error.stack ? error.stack.toString() : 'No stack trace available';
        
        if (errorMessage.length > 950) errorMessage = errorMessage.slice(0, 950) + '... view console for details';
        if (stackMessage.length > 950) stackMessage = stackMessage.slice(0, 950) + '... view console for details';
        
        const embed = new EmbedBuilder()
            .setTitle('🚨・A websocket connection encountered an error')
            .addFields([
                {
                    name: 'Error',
                    value: `\`\`\`${errorMessage}\`\`\``
                },
                {
                    name: 'Stack error',
                    value: `\`\`\`${stackMessage}\`\`\``
                }
            ])
            .setColor(config.ErrorColor)
            .setTimestamp();
        
        // Send to all configured changelog channels
        for (const guildId in changelogChannels) {
            try {
                const channelId = changelogChannels[guildId].channelId;
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    await channel.send({
                        username: 'Bot Logs',
                        embeds: [embed]
                    });
                }
            } catch (err) {
                console.error(`Failed to send error log to changelog channel in guild ${guildId}:`, err);
            }
        }
    }
});

client.login(config.token);
