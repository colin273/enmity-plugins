import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters } from "enmity-api/modules";
import { create, PatchCallback } from "enmity-api/patcher";
import { version, description } from "../package.json" assert { type: "json"};

const patcher = create("freemoji");

const { messages } = window.enmity.modules.common;
//const { sendStickers } = messages;

const [
  Usability,
  LazyActionSheet,
  //{ getStickerById },
  { getChannel }
] = bulk(
  filters.byProps("canUseEmojisEverywhere", "canUseAnimatedEmojis"),
  filters.byProps("openLazy", "hideActionSheet"),
  //filters.byProps("getStickerById"),
  filters.byProps("getChannel")
);

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
  // @ts-ignore
  version,
  description,
  authors: [
    {
      name: "FifiTheBulldog",
      id: "690213339862794285"
    }
  ],
  color: "#f9a418",

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

    const unpatchEntry = patcher.before(Usability, "canUseEmojisEverywhere", (_, [{premiumType}]) => {
      // @ts-ignore
      unpatchEntry();
      if (!premiumType) {
        patcher.instead(Usability, "canUseEmojisEverywhere", () => isNotReacting);
        patcher.instead(Usability, "canUseAnimatedEmojis", () => isNotReacting);

        patcher.before(messages, "sendMessage", (_, [channelId, message]) => {
          const channel = getChannel(channelId);
          message.validNonShortcutEmojis.forEach((e: Emoji, i: number) => {
            if (e.guildId !== channel.guild_id || e.animated) {
              message.content = message.content.replace(
                `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
                e.url.replace("webp", "png").replace(/size=\d+/, "size=48")
              )
              delete message.validNonShortcutEmojis[i];
            }
          });
          message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter((e: Emoji) => e);
        });
        
        // Patch stickers - TODO
        /*
        patcher.instead(usability, "canUseStickersEverywhere", () => true);
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
        */
      }
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);
