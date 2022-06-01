import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters } from "enmity/metro";
import { NavigationNative, React, Toasts } from "enmity/metro/common";
import { create } from "enmity/patcher";
import { Button } from "enmity/components";
import metadata from "../manifest.json" assert { type: "json" };

import findInReactTree from "enmity/utilities/findInReactTree";

const patcher = create("create-webhooks");

const [
  { create: createWebhook },
  { getChannels },
  { can },
  { Permissions: { MANAGE_WEBHOOKS } },
  { default: { Messages: Strings } }
  // { locale }
] = bulk(
  filters.byProps("update", "create", "fetchForChannel"),
  filters.byProps("getChannels"),
  filters.byProps("can", "_dispatcher"),
  filters.byProps("Permissions"),
  (m => m?.default?.Messages?.SETTINGS_WEBHOOKS_EMPTY_BODY_IOS)
  // filters.byProps("locale", "theme")
);

const originalWebhooksUnavailableText = Strings.SETTINGS_WEBHOOKS_EMPTY_BODY_IOS;

// Res of webhook overview render:
/*
{
  '$$typeof': {},
  type: [Function: ConnectedWebhooksOverview],
  key: null,
  ref: null,
  props: { channelId: '856630401262813185' },
  _owner: null
}
*/

/*
{
  '$$typeof': {},
  type: [Function: ConnectedWebhooksOverview],
  key: null,
  ref: null,
  props: { guildId: '753718191359918201' },
  _owner: null
}
*/

const CreateWebhooks: Plugin = {
  ...metadata,

  onStart() {
    let currentGuild: string = undefined;
    let currentChannel: string = undefined;

    patcher.after(NavigationNative.NavigationContainer, "render", (_, [{theme}], res) => {
      let channelIdsUnpatch: () => void;

      const webhookScreen = findInReactTree(res, (o: any) => {
        return o?.screens?.WEBHOOKS;
      })?.screens?.WEBHOOKS;

      if (webhookScreen) {
        const buttonColor: string = theme?.colors?.text ?? "#fff";

        // TO DO: Use an Image with a + asset
        // (proper assets API coming in Enmity rewrite, wait for now)
        webhookScreen.headerRight = () => React.createElement(Button, {
          color: buttonColor,
          title: "\uff0b", // Slightly larger + sign
          onPress: () => {
            let targetChannel: string = currentChannel ||
                                        getChannels(currentGuild)
                                          .SELECTABLE
                                          .find((c: Record<string, any>) => can(
                                            MANAGE_WEBHOOKS, c.channel
                                          ))?.channel?.id;
            if (targetChannel) {
              createWebhook(currentGuild, targetChannel);
            } else {
              // Maybe add asset later and use enmity-api's toasts functionality
              Toasts.open({
                content: "Error creating webhook"
              });
            }
          }
        });

        channelIdsUnpatch();
        channelIdsUnpatch = patcher.after(webhookScreen, "render", (_, args, res) => {
          currentGuild = res?.props?.guildId;
          currentChannel = res?.props?.channelId;
        });
      }
    });

    Strings.SETTINGS_WEBHOOKS_EMPTY_BODY_IOS = " ";
  },

  onStop() {
    patcher.unpatchAll();
    Strings.SETTINGS_WEBHOOKS_EMPTY_BODY_IOS = originalWebhooksUnavailableText;
  }
};

registerPlugin(CreateWebhooks);
