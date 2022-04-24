import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters } from "enmity-api/modules";
import { create } from "enmity-api/patcher";
import { fetchCurrentUser } from "enmity-api/users";

const patcher = create("freemoji");

const { messages } = window.enmity.modules.common;
const { sendStickers } = messages;

const [
  Usability,
  EmojiPickerActionSheet,
  //{ getStickerById },
  { getChannel }
] = bulk(
  filters.byProps("canUseEmojisEverywhere", "canUseAnimatedEmojis"),
  filters.byProps("openEmojiPickerActionSheet"),
  //filters.byProps("getStickerById"),
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
    fetchCurrentUser().then(({ premiumType }) => {
      if (premiumType) {
        // Patch emoji
        let isReacting = false;

        patcher.instead(Usability, "canUseEmojisEverywhere", () => !isReacting);

        patcher.instead(Usability, "canUseAnimatedEmojis", () => !isReacting);

        patcher.before(messages, "sendMessage", (_, [channelId, message]) => {
          const channel = getChannel(channelId);
          message.validNonShortcutEmojis.forEach((e: Emoji, i: number) => {
            if (e.guildId !== channel.guild_id) {
              e.size = 24; // getEmojiURL returns a size that is twice this value
              message.content = message.content.replace(
                `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
                e.url.replace("webp", "png").replace(/=\d+/, "=48")
              )
              delete message.validNonShortcutEmojis[i];
            }
          })
          message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter((e: Emoji) => e);
        });

        patcher.before(EmojiPickerActionSheet, "openEmojiPickerActionSheet", (_, [options]) => {
          isReacting = (options.pickerIntention === 0);
          if (options.onPressEmoji && isReacting) {
            const ogOnPressEmoji = options.onPressEmoji;
            options.onPressEmoji = function (...onPressArgs: any[]) {
              isReacting = false;
              return ogOnPressEmoji(...onPressArgs);
            };
          }
        });
        
        // canUseEmojisEverywhere gets a single argument, the user object
        // Presumably so does canUseAnimatedEmojis
        // We don't necessarily need to patch these? Unless...
        // But we do need to patch the modal
        //   openEmojiPickerActionSheet
        // Food for thought -- these are the logs of args and res for two
        // different calls to openEmojiPickerActionSheet
        // IIRC the first is from opening for reactions
        // And the second is from opening to select a chat emoji
        // Note the picker intention argument
        // We can use this to determine whether to actually send anything
        // Props:
        //   - channel (channel object)
        //   - onPressEmoji
        //   - onClose (only for searching for a chat emoji)
        //   - pickerIntention: 0 for reaction, 3 to search for a chat emoji
        // OK, can't seem to find a module related to picker intention
        // So we'll have to do this bit manually
        
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
