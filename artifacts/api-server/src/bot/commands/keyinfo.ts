import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import type { BotCommand } from "../index";

const STATUS_COLORS: Record<string, number> = {
  active: 0x57f287,
  pending: 0xfee75c,
  expired: 0xed4245,
  revoked: 0x99aab5,
};

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("keyinfo")
    .setDescription("View detailed information about a license key")
    .addStringOption((opt) =>
      opt.setName("key").setDescription("The license key").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("key", true).toUpperCase();

    const license = await LicenseModel.findOne({ key });
    if (!license) {
      await interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return;
    }

    // Auto-expire check
    if (license.status === "active" && license.expiresAt && new Date() > license.expiresAt) {
      await LicenseModel.findByIdAndUpdate(license._id, { status: "expired" });
      license.status = "expired";
    }

    const embed = new EmbedBuilder()
      .setColor(STATUS_COLORS[license.status] ?? 0x5865f2)
      .setTitle(`🔑 Key Info: \`${key}\``)
      .addFields(
        { name: "Status", value: license.status.toUpperCase(), inline: true },
        { name: "Plan", value: license.plan.charAt(0).toUpperCase() + license.plan.slice(1), inline: true },
        { name: "Duration", value: license.durationDays ? `${license.durationDays} days` : "Lifetime", inline: true },
        { name: "Created By", value: `<@${license.createdBy}>`, inline: true },
        { name: "Created At", value: `<t:${Math.floor(license.createdAt.getTime() / 1000)}:F>`, inline: true },
        {
          name: "Redeemed By",
          value: license.redeemedBy ? `<@${license.redeemedBy}> (${license.redeemedByUsername})` : "Not redeemed",
          inline: true,
        },
        {
          name: "Redeemed At",
          value: license.redeemedAt ? `<t:${Math.floor(license.redeemedAt.getTime() / 1000)}:F>` : "N/A",
          inline: true,
        },
        {
          name: "Expires At",
          value: license.expiresAt ? `<t:${Math.floor(license.expiresAt.getTime() / 1000)}:F>` : "Never",
          inline: true,
        },
      )
      .setTimestamp();

    if (license.notes) embed.addFields({ name: "Notes", value: license.notes });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
