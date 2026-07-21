import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import UserModel from "../../models/User";
import type { BotCommand } from "../index";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("resetkey")
    .setDescription("Unlink a key from a user so it can be redeemed again")
    .addStringOption((opt) =>
      opt.setName("key").setDescription("The license key to reset").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("key", true).toUpperCase();

    const license = await LicenseModel.findOne({ key });
    if (!license) {
      await interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return;
    }
    if (!license.redeemedBy) {
      await interaction.editReply({ content: `⚠️ Key \`${key}\` has not been redeemed yet.` });
      return;
    }

    const prevUser = license.redeemedByUsername;
    const prevUserId = license.redeemedBy;

    await LicenseModel.findByIdAndUpdate(license._id, {
      status: "pending",
      redeemedBy: null,
      redeemedByUsername: null,
      redeemedAt: null,
    });

    // Remove key from the user's account
    if (prevUserId) {
      await UserModel.findOneAndUpdate({ discordId: prevUserId }, { licenseKey: null });
    }

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle("🔄 License Key Reset")
      .addFields(
        { name: "Key", value: `\`${key}\``, inline: true },
        { name: "Previously Held By", value: prevUser || "Unknown", inline: true },
        { name: "Reset By", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Status", value: "Key is now available for redemption", inline: false },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
