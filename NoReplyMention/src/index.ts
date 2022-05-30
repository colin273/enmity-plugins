import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { getByProps } from "enmity/metro";
import { create } from "enmity/patcher";
import { version, description } from "../package.json" assert { type: "json"};

const patcher = create("no-reply-mention");

const pendingReplyModule = getByProps("createPendingReply");

const NoReplyMention: Plugin = {
  name: "NoReplyMention",
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
    patcher.before(pendingReplyModule, "createPendingReply", (_, args) => {
      args[0].shouldMention = false;
    });
  },

  onStop() {
    patcher.unpatchAll();
  }
};

registerPlugin(NoReplyMention);