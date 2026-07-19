import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import UserModel from "../../models/User";
import type { BotCommand } from "../index";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("revokekey")
    .setDescription("Revoke a license key permanently")
    .addStringOption((opt) =>
      opt.setName("key").setDescription("The license key to revoke").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("key", true).toUpperCase();

    const license = await LicenseModel.findOne({ key });
    if (!license) {
      await interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return;
    }
    if (license.status === "revoked") {
      await interaction.editReply({ content: `⚠️ Key \`${key}\` is already revoked.` });
      return;
    }

    await LicenseModel.findByIdAndUpdate(license._id, {
      status: "revoked",
      revokedBy: interaction.user.id,
      revokedAt: new Date(),
    });

    // Remove license from user if redeemed
    if (license.redeemedBy) {
      await UserModel.findOneAndUpdate({ discordId: license.redeemedBy }, { licenseKey: null });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("🚫 License Key Revoked")
      .addFields(
        { name: "Key", value: `\`${key}\``, inline: true },
        { name: "Plan", value: license.plan, inline: true },
        { name: "Previously Held By", value: license.redeemedByUsername || "Not redeemed", inline: true },
        { name: "Revoked By", value: `<@${interaction.user.id}>`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
