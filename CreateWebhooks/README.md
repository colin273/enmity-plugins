# Freemoji

Send external emoji in the chat without Nitro as image links. Emoji that you would normally be unable to send are unaffected, while external emoji are converted to image links. (Note: if you try to use external emojis in the middle of other text, the link will be visible. This also cannot support adding external emoji as reactions.)

Ported from [nitro-spoof](https://github.com/luimu64/nitro-spoof) for [GooseMod](https://goosemod.com). Partial support for stickers will be based on [nitro-bypass](https://github.com/notmarek/nitro-bypass) for [Powercord](https://powercord.dev). Additional inspiration, including the name of this plugin, is drawn from [Freemoji](https://github.com/QbDesu/BetterDiscordAddons/blob/potato/Plugins/Freemoji/Freemoji.plugin.js) for [BetterDiscord](https://betterdiscord.app).

Planned features:

- [x] Fix non-external animated emojis
- [ ] Support non-animated stickers
- [ ] Check whether sticker is animated, since animated stickers are APNG at best
- [ ] Allow user to customize Nitro emoji size (48px is the default) either in settings or with a command
- [x] Check whether user already has Nitro, in case someone with Nitro tries to use this
- [ ] Check whether user would be allowed to send external emojis in the current channel
- [ ] Check whether user can embed links in the current channel