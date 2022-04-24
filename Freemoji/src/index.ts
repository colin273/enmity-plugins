import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters } from "enmity-api/modules";
import { create } from "enmity-api/patcher";

const patcher = create("freemoji");

const { messages } = window.enmity.modules.common;
const { sendStickers } = messages;

const [
  usability,
  { getEmojiURL },
  { getStickerById },
  { getChannel }
] = bulk(
  filters.byProps("canUseEmojisEverywhere", "canUseAnimatedEmojis"),
  filters.byProps("getEmojiURL"),
  filters.byProps("getStickerById"),
  filters.byProps("getChannel")
)

type Emoji = {
  roles: any[],
  require_colons: boolean,
  name: string,
  managed: boolean,
  id: string,
  available: boolean,
  animated: boolean,
  url: string,
  allNamesString: string,
  guildId: string,
  size: number
}

const Freemoji: Plugin = {
  name: "Freemoji",

  onStart() {
    // Patch emoji
    patcher.instead(usability, "canUseEmojisEverywhere", () => true);
    patcher.instead(usability, "canUseAnimatedEmojis", () => true);
    patcher.before(messages, "sendMessage", (_, [channelId, message]) => {
      const channel = getChannel(channelId);
      message.validNonShortcutEmojis.forEach((e: Emoji, i: number) => {
        if (e.guildId !== channel.guild_id) {
          e.size = 24; // getEmojiURL returns a size that is twice this value
          message.content = message.content.replace(
            `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
            getEmojiURL(e).replace("webp", "png")
          )
          delete message.validNonShortcutEmojis[i];
        }
      })
      message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter((e: Emoji) => e);
    });

    // Patch stickers
    patcher.instead(usability, "canUse StickersEverywhere", () => true);
    const { sendStickers } = messages;
    patcher.before(messages, "sendStickers", (_, args) => {
      const channel = getChannel(args[0]);
      const stickerUrls: string[] = [];
      args[1].forEach((s: string, i: number) => {
        const sticker = getStickerById(s);
        if (sticker.guild_id !== channel.guild_id) {
          stickerUrls.push(`https://media.discordapp.net/stickers/${s}?size=320`);
          delete args[1][i];
        }
      })
      args[1] = args[1].filter((s: string) => s);
      if (args[1]) {
        sendStickers(...args);
      } else {
        messages.sendMessage(args[0], { content: stickerUrls.join("\n") });
      }
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);