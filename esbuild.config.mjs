import esbuild from "esbuild";
import process from "process";
import {writeFile} from "fs/promises";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source visit the plugins github repository (https://github.com/Vinzent03/obsidian-advanced-uri)
*/
`;

const prod = process.argv[2] === "production";

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    metafile: prod,
    platform: "browser",
    minify: prod,
    outdir: "dist"
});

if (prod) {
    const result = await context.rebuild();

    await writeFile("dist/meta.json", JSON.stringify(result.metafile, undefined, 2));
    process.exit(0);
} else {
    await context.watch();
}
