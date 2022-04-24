import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters } from "enmity-api/modules";
import { create } from "enmity-api/patcher";

const patcher = create("freemoji");

const [
  parserModule,
  { getEmojiURL }
] = bulk(
  filters.byProps("parse", "unparse", "parsePreprocessor"),
  filters.byProps("getEmojiURL")
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
    patcher.after(parserModule, "parse", (_, args, res) => {
      res.validNonShortcutEmojis.forEach((emoji: Emoji, i: number) => {
        if (true /* Change this later to test whether an emoji is available or not */) {
          emoji.size = 24; // 1/2 of size we want
          const url = getEmojiURL(emoji).replace("webp", "png");
          res.content = res.content.replace(`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`, url);
          delete res.validNonShortcutEmojis[i];
        }
        res.validNonShortcutEmojis = res.validNonShortcutEmojis.filter((e: Emoji) => e);
      });
    })
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);