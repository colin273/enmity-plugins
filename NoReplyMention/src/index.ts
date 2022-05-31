import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { getByProps } from "enmity/metro";
import { create } from "enmity/patcher";
import metadata from "../manifest.json" assert { type: "json"};

const patcher = create("no-reply-mention");

const pendingReplyModule = getByProps("createPendingReply");

const NoReplyMention: Plugin = {
  ...metadata,

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