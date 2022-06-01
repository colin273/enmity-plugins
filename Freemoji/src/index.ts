import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters } from "enmity/metro";
import { Messages } from "enmity/metro/common";
import { create } from "enmity/patcher";
import metadata from "../manifest.json" assert { type: "json" };

const patcher = create("freemoji");
//const { sendStickers } = Messages;

const [
  Usability,
  LazyActionSheet,
  //SendableStickers,
  //{ getStickerById },
  { getChannel }
] = bulk(
  filters.byProps("canUseEmojisEverywhere", "canUseAnimatedEmojis"),
  filters.byProps("openLazy", "hideActionSheet"),
  //filters.byProps("isSendableSticker"),
  //filters.byProps("getStickerById"),
  filters.byProps("getChannel")
);

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

enum PremiumTypes {
  None,
  Classic,
  Nitro
}

enum StickerFormats {
  PNG,
  APNG,
  Lottie
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

    const unpatchEmojiEntry = patcher.before(Usability, "canUseEmojisEverywhere", (_, [{premiumType}]) => {
      // @ts-ignore
      unpatchEmojiEntry();

      // Emojis everywhere available by default for regular and classic Nitro
      if ((premiumType ?? 0) === PremiumTypes.None) {
        // single argument for both: user object
        patcher.instead(Usability, "canUseEmojisEverywhere", () => isNotReacting);
        patcher.instead(Usability, "canUseAnimatedEmojis", () => isNotReacting);

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
      }
    });

    /*
    It would be really nice if the sticker patch actually worked.
    *
    const unpatchStickersEntry = patcher.before(SendableStickers, "isSendableSticker", (_, [, {premiumType}]) => {
      // @ts-ignore
      unpatchStickersEntry();
      
      // Stickers everywhere available by default for regular Nitro only
      if ((premiumType ?? 0) < PremiumTypes.Nitro) {
        patcher.instead(SendableStickers, "isSendableSticker", (_, args, original) => {
          // args: sticker, user, channel
          switch (args[0].format_type) {
            case StickerFormats.PNG:
              return true;
            default:
              return original(...args);
          }
        });

        patcher.instead(Usability, "canUseStickersEverywhere", () => true);

        patcher.instead(Messages, "sendStickers", (_, args, original) => {
          // args: channel ID, sticker ID, string (empty), object (empty)
          const [channelId, [stickerId]] = args;
          const channel = getChannel(channelId);
          const sticker = getStickerById(stickerId);
          if (channel.guild_id !== sticker.guild_id) { // condition needs to evaluate whether to replace sticker
            return Messages.sendMessage(channelId, {
              content: `https://media.discordapp.net/stickers/${stickerId}.png`
            });
          } else {
            return original(...args);
          }
        });
      }
    });*/
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(Freemoji);
