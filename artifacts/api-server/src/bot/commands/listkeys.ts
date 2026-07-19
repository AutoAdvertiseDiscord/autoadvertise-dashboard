import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import LicenseModel from "../../models/License";
import type { BotCommand } from "../index";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("listkeys")
    .setDescription("List license keys with optional filters")
    .addStringOption((opt) =>
      opt
        .setName("filter")
        .setDescription("Filter by status")
        .addChoices(
          { name: "All", value: "all" },
          { name: "Pending", value: "pending" },
          { name: "Active", value: "active" },
          { name: "Expired", value: "expired" },
          { name: "Revoked", value: "revoked" },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const filter = interaction.options.getString("filter") || "all";

    const query = filter === "all" ? {} : { status: filter };
    const keys = await LicenseModel.find(query).sort({ createdAt: -1 }).limit(20);

    if (!keys.length) {
      await interaction.editReply({ content: `No keys found${filter !== "all" ? ` with status: ${filter}` : ""}.` });
      return;
    }

    const STATUS_EMOJI: Record<string, string> = {
      active: "🟢",
      pending: "🟡",
      expired: "🔴",
      revoked: "⚫",
    };

    const keyList = keys
      .map((k) => `${STATUS_EMOJI[k.status] || "⚪"} \`${k.key}\` — ${k.plan} | ${k.status}${k.redeemedByUsername ? ` | ${k.redeemedByUsername}` : ""}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 License Keys (${filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)})`)
      .setDescription(keyList.substring(0, 4000))
      .setFooter({ text: `Showing up to 20 keys${keys.length === 20 ? " (use filter to narrow results)" : ""}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
