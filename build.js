// Based on https://github.com/NotZoeyDev/Enmity-Plugins/blob/7baf2017d6ffab4190677fe86465d6360735f8be/PluginTemplate/rollup.config.ts

import { defineConfig, rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pluginJson from "@rollup/plugin-json";

import { basename, join } from "path";
import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";

async function createPluginJson(pluginName) {
  const info = JSON.parse(await readFile(join(pluginName, "manifest.json"), { encoding: "utf-8"}));
  return JSON.stringify({
    "name": pluginName,
    "description": info?.description ?? "No description was provided.",
    "author": info?.authors?.map?.(a => a.name)?.join?.(", ") ?? "Unknown",
    "version": info?.version ?? "1.0.0"
  }, null, 2);
}

let plugins;
async function listPlugins() {
  if (!plugins) {
    plugins = (await readdir(".", { withFileTypes: true })).filter(f => {
      const l = f.name[0]
      return f.isDirectory() && ("A" <= l && "Z" >= l)
    }).map(f => f.name);
  }
  return plugins;
}

async function parseOptions(args) {
  const lastArg = basename(args[args.length - 1]);
  if (plugins.some(p => p === lastArg)) {
    return { plugin: lastArg, all: false };
  } else {
    return { all: true };
  }
}

async function buildPlugin(pluginName) {
  const inputOptions = defineConfig({
    input: join(pluginName, "src", "index.ts"),
    output: [
      {
        file: `dist/${pluginName}.js`,
        format: "cjs",
        strict: false
      },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      esbuild({ minify: true, target: "ES2019" }),
      pluginJson()
    ]
  });

  const bundle = await rollup(inputOptions);
  const output = await bundle.generate({
    format: "cjs",
    strict: false
  });

  for (const item of output.output) {
    if (item.type === "chunk") {
      await writeFile(join("dist", pluginName + ".js"), item.code);
      await writeFile(join("dist", pluginName + ".json"), await createPluginJson(pluginName))
    }
  }
  bundle.close();
}

(async () => {
  await listPlugins();
  const options = await parseOptions(process.argv);

  try {
    await access("dist")
  } catch {
    await mkdir("dist");
  }

  if (!options.all) {
    buildPlugin(options.plugin);
  } else {
    for (const plugin of plugins) {
      buildPlugin(plugin);
    }
  }
})();