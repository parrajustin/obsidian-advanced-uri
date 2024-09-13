import type { StatusError } from "src/lib/status_error";
import { InternalError, InvalidArgumentError, NotFoundError } from "src/lib/status_error";
import type AdvancedURI from "src/main";
import { OpenFile } from "../filesystem";
import { getAlternativeFilePath } from "../utils";
import type { OpenMode } from "../types";
import { MarkdownView } from "obsidian";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";

export interface OpenBlockUriParams {
    type: "open-block";
    block?: string;
    openMode?: OpenMode;
    filepath?: string;
}

/** Handles the uri to open a block. */
export async function HandleOpenBlock(
    parameters: OpenBlockUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    const blockId = parameters.block;
    if (blockId === undefined) {
        return Err(InvalidArgumentError("param `block` is required."));
    }

    const file = pluginClass.tools.getFileFromBlockID(blockId);
    if (file.err) {
        return Err(NotFoundError(`could not find file with block id "${blockId}".`));
    }

    const openFileResult = await OpenFile(
        {
            file:
                getAlternativeFilePath(pluginClass.app, file.safeUnwrap()) +
                "#^" +
                parameters.block,
            setting: pluginClass.settings.openFileWithoutWriteInNewPane,
            parameters: {
                openmode: parameters.openMode,
                filepath: parameters.filepath
            }
        },
        pluginClass.app
    );
    if (openFileResult.err) {
        return openFileResult;
    }
    const view = pluginClass.app.workspace.getActiveViewOfType<MarkdownView>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MarkdownView as any
    );
    if (!view) {
        return Err(InternalError("No active view found."));
    }
    const fileFromView = view.file;
    if (fileFromView === null) {
        return Err(InternalError("No file in active view found."));
    }
    const cache = pluginClass.app.metadataCache.getFileCache(fileFromView);
    if (cache === null || cache.blocks === undefined) {
        return Err(InternalError("No file cache or cache blocks found."));
    }
    const block = cache.blocks[blockId];
    if (block === undefined) {
        return Err(NotFoundError(`Failed to find block "${blockId}".`));
    }
    view.editor.focus();
    view.editor.setCursor({ line: block.position.start.line, ch: 0 });
    return Ok();
}
