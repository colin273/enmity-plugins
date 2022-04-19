import { Plugin, registerPlugin } from "enmity-api/plugins";
import { getByProps } from "enmity-api/modules";
import { create } from "enmity-api/patcher";

const patcher = create("no-reply-mention");

const pendingReplyModule = getByProps("createPendingReply");

const NoReplyMention: Plugin = {
  name: "NoReplyMention",

  onStart() {
    patcher.before(pendingReplyModule, "createPendingReply", (_, args) => {
      args[0].shouldMention = false;
      return args;
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(NoReplyMention);