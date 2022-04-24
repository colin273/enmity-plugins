import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters } from "enmity-api/modules";
import { create } from "enmity-api/patcher";

const patcher = create("freemoji");

const [
  parserModule,
  { getEmojiURL },
  usability,
  { getChannel }
] = bulk(
  filters.byProps("parse", "unparse", "parsePreprocessor"),
  filters.byProps("getEmojiURL"),
  filters.byProps("canUseEmojisEverywhere", "canUseAnimatedEmojis"),
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
    patcher.after(usability, "canUseEmojisEverywhere", () => true);
    patcher.after(usability, "canUseAnimatedEmojis", () => true);
    patcher.before(window.enmity.modules.common.messages, "sendMessage", (_, [channelId, message]) => {
      const channel = getChannel(channelId);
      message.validNonShortcutEmojis.forEach((e: Emoji, i: number) => {
        if (e.guildId !== channel.guild_id) {
          e.size = 24;
          message.content = message.content.replace(
            `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
            getEmojiURL(e).replace("webp", "png")
          )
          delete message.validNonShortcutEmojis[i];
        }
      })
      message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter((e: Emoji) => e);
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);