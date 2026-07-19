import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import UserModel from "../../models/User";
import type { BotCommand } from "../index";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("deletekey")
    .setDescription("Permanently delete a license key from the database")
    .addStringOption((opt) =>
      opt.setName("key").setDescription("The license key to delete").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("key", true).toUpperCase();

    const license = await LicenseModel.findOne({ key });
    if (!license) {
      await interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return;
    }

    // Remove from user if redeemed
    if (license.redeemedBy) {
      await UserModel.findOneAndUpdate({ discordId: license.redeemedBy }, { licenseKey: null });
    }

    await LicenseModel.findByIdAndDelete(license._id);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("🗑️ License Key Permanently Deleted")
      .addFields(
        { name: "Key", value: `\`${key}\``, inline: true },
        { name: "Plan", value: license.plan, inline: true },
        { name: "Was Held By", value: license.redeemedByUsername || "Not redeemed", inline: true },
        { name: "Deleted By", value: `<@${interaction.user.id}>`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
