import { Notice, TFile } from "obsidian";
import { CopyText } from "../utils";
import type AdvancedURI from "../main";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import { InvalidArgumentError, NotFoundError } from "../lib/status_error";

interface FrontmatterRef {
    /** The actual frontmatter item value. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any;
    /** The frontmatter parent value. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent: any;
    /** the item's key in parent. */
    itemKey: string | number;
}

/** URIs params for frontmatter data. */
export interface FrontmatterUriParams {
    type: "frontmatter";
    /** Obisidan file path for the wanted file. */
    filepath?: string;
    /** Comma seperated list of path to the given front matter item. */
    frontmatterkey: string;
    /** JSON to write to the given frontmatter key. */
    data?: string;
}

/**
 * Gets the frontmatter item from a given path.
 * @param frontmatter
 * @param path
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GetFrontmatterItem(frontmatter: any, path: string): FrontmatterRef | undefined {
    const list = path.split(",");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cache: any = frontmatter;
    let parent = frontmatter;
    let key: string | number = "";
    for (let i = 0; i < list.length; i++) {
        if (cache === undefined) {
            new Notice(`Failed to follow path "${path}"`);
            return undefined;
        }
        const item = list[i] as string;
        key = item;
        if (cache instanceof Array) {
            const index = parseInt(item);
            // Find the item in the array.
            if (Number.isNaN(index)) {
                parent = cache;
                key = item;
                cache = cache.find((e) => e === item);
            } else {
                key = index;
                parent = cache;
                cache = cache[index];
            }
        } else {
            parent = cache;
            cache = cache[item];
        }
    }
    return { item: cache, itemKey: key, parent };
}

/** Handle frontmatter data for the given file or active file if none specified. */
export async function HandleFrontmatterKey(
    parameters: FrontmatterUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    const filePath = parameters.filepath ?? pluginClass.app.workspace.getActiveFile()?.path;
    if (filePath === undefined) {
        return Err(InvalidArgumentError("No file path provided."));
    }
    const file = pluginClass.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        return Err(NotFoundError(`Could not find file for "${filePath}".`));
    }
    const cache = pluginClass.app.metadataCache.getFileCache(file);
    if (cache === null) {
        return Err(NotFoundError(`Could not find the file cache for "${filePath}".`));
    }
    const cachedFrontmatter = cache.frontmatter;

    const data = parameters.data;
    if (data !== undefined && parameters.data !== "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedData: any;
        try {
            // This try catch is needed to allow passing strings as a data value without extra ".
            parsedData = JSON.parse(data);
        } catch {
            parsedData = `"${data}"`;
            new Notice(`Failed to parse "${data}"`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pluginClass.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
            const frontmatterItem = GetFrontmatterItem(frontmatter, parameters.frontmatterkey);
            if (frontmatterItem !== undefined) {
                frontmatterItem.parent[frontmatterItem.itemKey] = parsedData;
            }
        });
    } else {
        const frontmatterItem = GetFrontmatterItem(cachedFrontmatter, parameters.frontmatterkey);
        if (frontmatterItem !== undefined) {
            await CopyText(frontmatterItem.item);
        }
    }

    return Ok();
}
