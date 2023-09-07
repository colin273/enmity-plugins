import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters, getByProps } from "enmity/metro";
import { Messages } from "enmity/metro/common";
import { create } from "enmity/patcher";
import metadata from "../manifest.json" assert { type: "json" };

const patcher = create("freemoji");

const [
  LazyActionSheet,
  { getChannel }
] = bulk(
  filters.byProps("openLazy", "hideActionSheet"),
  filters.byProps("getChannel")
);

const usability = getByProps("canUseEmojisEverywhere", "canUseAnimatedEmojis", {
  defaultExport: false
});

type Emoji = {
  roles: any[],
  require_colons: boolean,
  name: string,
  originalName?: string,
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
  ...metadata,

  onStart() {
    let isNotReacting = true;

    // Do not modify default picker behavior for adding reactions
    patcher.before(LazyActionSheet, "openLazy", (_, [, sheetName, {pickerIntention}]) => {
      switch (sheetName) {
        case "EmojiPickerActionSheet":
          // pickerIntention: 0 for reaction, 3 to search for a chat emoji
          if (pickerIntention !== 0) {
            break;
          }
        case "MessageLongPressActionSheet":
          isNotReacting = false;
      }
    });

    patcher.after(LazyActionSheet, "hideActionSheet", () => {
      isNotReacting = true;
    });

    // The default export of the Nitro capabilities module is a frozen object
    // Therefore, we can't patch it directly
    // Solution: soften it up with a shallow copy
    usability.default = { ...usability.default };

    // arguments: channel ID, message, two more
    patcher.before(Messages, "sendMessage", (_, [channelId, message]) => {
      const channel = getChannel(channelId);
      message.validNonShortcutEmojis.forEach((e: Emoji, i: number) => {
        if (e.guildId !== channel.guild_id || e.animated) {
          message.content = message.content.replace(
            `<${e.animated ? "a" : ""}:${e.originalName ?? e.name}:${e.id}>`,
            e.url.replace("webp", "png").replace(/size=\d+/, "size=48")
          )
          delete message.validNonShortcutEmojis[i];
        }
      });
      message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter((e: Emoji) => e);
    });

    patcher.instead(usability.default, "canUseEmojisEverywhere", () => isNotReacting);
    patcher.instead(usability.default, "canUseAnimatedEmojis", () => isNotReacting);
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);
