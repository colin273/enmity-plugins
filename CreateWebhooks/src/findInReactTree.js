// Copied from Powercord's version of findInReactTree from @rauenzi's BDPluginLibrary,
// available under the MIT license.
// https://github.com/rauenzi/BDPluginLibrary/blob/379e15a7505851f8568199b2062417f5b19ff85b/src/modules/utilities.js#L127
// https://github.com/powercord-org/powercord/blob/v2/src/fake_node_modules/powercord/util/findInReactTree.js
// https://github.com/powercord-org/powercord/blob/v2/src/fake_node_modules/powercord/util/findInTree.js

function findInTree (tree, filter, { walkable = null, ignore = [] } = {}) {
  if (!tree || typeof tree !== 'object') {
    return null;
  }

  if (typeof filter === 'string') {
    if (tree.hasOwnProperty(filter)) {
      return tree[filter];
    }

    return;
  } else if (filter(tree)) {
    return tree;
  }

  let returnValue = null;

  if (Array.isArray(tree)) {
    for (const value of tree) {
      returnValue = findInTree(value, filter, {
        walkable,
        ignore
      });

      if (returnValue) {
        return returnValue;
      }
    }
  } else {
    const walkables = !walkable ? Object.keys(tree) : walkable;

    for (const key of walkables) {
      if (!tree.hasOwnProperty(key) || ignore.includes(key)) {
        continue;
      }

      returnValue = findInTree(tree[key], filter, {
        walkable,
        ignore
      });

      if (returnValue) {
        return returnValue;
      }
    }
  }

  return returnValue;
};

export const findInReactTree = (tree, filter) => findInTree(tree, filter, {
  walkable: [ 'props', 'children', 'child', 'sibling' ]
});