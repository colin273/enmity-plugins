import { Plugin, registerPlugin } from "enmity-api/plugins";
import { bulk, filters, getModule, getByProps } from "enmity-api/modules";
import { create } from "enmity-api/patcher";
//import { showToast } from "enmity-api/toast";
import { Button, React } from "enmity-api/react";
import { version, description } from "../package.json" assert { type: "json"};

import { findInReactTree } from "./findInReactTree";

const patcher = create("create-webhooks");

const [
  { create: createWebhook },
  { getChannels },
  { can },
  { Permissions: { MANAGE_WEBHOOKS } },
  // { locale }
] = bulk(
  filters.byProps("update", "create", "fetchForChannel"),
  filters.byProps("getChannels"),
  filters.byProps("can", "_dispatcher"),
  filters.byProps("Permissions"),
  // filters.byProps("locale", "theme")
);
const { NavigationContainer } = window.enmity.modules.common.navigationNative
                                ?? window.enmity.modules.common.NavigationNative;
const Strings = getModule(m => m?.default?.Messages?.SETTINGS_WEBHOOKS_EMPTY_BODY_IOS)?.default?.Messages;
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
  name: "CreateWebhooks",
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
    let currentGuild: string = undefined;
    let currentChannel: string = undefined;

    const renderPatch = patcher.after(NavigationContainer, "render", (_, [{theme}], res) => {
      const webhookScreen = findInReactTree(res, (o: any) => {
        return o?.screens?.WEBHOOKS;
      })?.screens?.WEBHOOKS;

      if (webhookScreen) {
        const buttonColor = theme?.colors?.text ?? "#fff";

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
              window.enmity.toast.showToast({
                content: "Error creating webhook"
              });
            }
          }
        });

        patcher.after(webhookScreen, "render", (_, args, res) => {
          currentGuild = res?.props?.guildId;
          currentChannel = res?.props?.channelId;
        });

        renderPatch.unpatchAll();
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
