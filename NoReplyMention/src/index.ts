import { Plugin, registerPlugin } from "enmity-api/plugins";
import { getByProps } from "enmity-api/modules";
import { create } from "enmity-api/patcher";
import { version, description } from "../package.json" assert { type: "json"};

const patcher = create("no-reply-mention");

const pendingReplyModule = getByProps("createPendingReply");

const NoReplyMention: Plugin = {
  name: "NoReplyMention",
  // @ts-ignore
  version,
  description,
  authors: [
    {
      name: "FifiTheBulldog",
      id: "690213339862794285"
    }
  ],

  onStart() {
    patcher.before(pendingReplyModule, "createPendingReply", (_, args) => {
      args[0].shouldMention = false;
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(NoReplyMention);