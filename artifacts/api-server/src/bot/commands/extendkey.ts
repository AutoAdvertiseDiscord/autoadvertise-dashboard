import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import type { BotCommand } from "../index";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("extendkey")
    .setDescription("Extend the duration of an existing license key")
    .addStringOption((opt) =>
      opt.setName("key").setDescription("The license key to extend").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt.setName("days").setDescription("Number of days to add").setRequired(true).setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("key", true).toUpperCase();
    const days = interaction.options.getInteger("days", true);

    const license = await LicenseModel.findOne({ key });
    if (!license) {
      await interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return;
    }
    if (license.status === "revoked") {
      await interaction.editReply({ content: `❌ Cannot extend a revoked key.` });
      return;
    }

    const base = license.expiresAt && license.expiresAt > new Date() ? license.expiresAt : new Date();
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + days);
    const newDuration = (license.durationDays ?? 0) + days;

    await LicenseModel.findByIdAndUpdate(license._id, {
      expiresAt: newExpiry,
      durationDays: newDuration,
      status: "active",
    });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("⏰ License Key Extended")
      .addFields(
        { name: "Key", value: `\`${key}\``, inline: true },
        { name: "Added", value: `${days} days`, inline: true },
        { name: "New Expiry", value: `<t:${Math.floor(newExpiry.getTime() / 1000)}:F>`, inline: true },
        { name: "Extended By", value: `<@${interaction.user.id}>`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
