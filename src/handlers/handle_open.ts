import { MarkdownView } from "obsidian";
import type { SetCursorInLineParams, SetCursorParams } from "../filesystem";
import { OpenFile, SetCursor, SetCursorInLine } from "../filesystem";
import type { StatusError } from "../lib/status_error";
import { InternalError, NotFoundError } from "../lib/status_error";
import type AdvancedURI from "../main";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";

export interface OpenUriParams extends SetCursorInLineParams, SetCursorParams {
    type: "open";
    /** File path of file to open. */
    filepath?: string;
    /** Heading to set cursor to. */
    heading?: string;
    /** Block to set cursor to. */
    block?: string;
    /** If the uid should be added to frontmatter. */
    writeUid?: boolean;
    /** If specified this is written as the uid. */
    uid?: string;
}

/** Handles opening a file and moving the cursor there. */
export async function HandleOpen(
    parameters: OpenUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    if (parameters.heading != undefined) {
        // If there is a heading param open the file and set cursor there.
        await OpenFile(
            {
                file: parameters.filepath + "#" + parameters.heading,
                setting: pluginClass.settings.openFileWithoutWriteInNewPane,
                parameters: parameters
            },
            pluginClass.app
        );
        const view = pluginClass.app.workspace.getActiveViewOfType<MarkdownView>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            MarkdownView as any
        );
        if (!view) {
            return Err(InternalError("No active view found."));
        }
        const file = view.file;
        if (file === null) {
            return Err(InternalError("No file in active view found."));
        }
        const cache = pluginClass.app.metadataCache.getFileCache(file);
        if (cache === null || cache.headings === undefined) {
            return Err(InternalError("No file cache found."));
        }
        const heading = cache.headings.find((e) => e.heading === parameters.heading);
        if (heading === undefined) {
            return Err(NotFoundError(`Failed to find heading "${parameters.heading}".`));
        }
        view.editor.focus();
        view.editor.setCursor({
            line: heading.position.start.line + 1,
            ch: 0
        });
    } else if (parameters.block != undefined) {
        // If there is a block param open the file and set cursor there.
        await OpenFile(
            {
                file: parameters.filepath + "#^" + parameters.block,
                setting: pluginClass.settings.openFileWithoutWriteInNewPane,
                parameters: parameters
            },
            pluginClass.app
        );
        const view = pluginClass.app.workspace.getActiveViewOfType<MarkdownView>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            MarkdownView as any
        );
        if (!view) {
            return Err(InternalError("No active view found."));
        }
        const file = view.file;
        if (file === null) {
            return Err(InternalError("No file in active view found."));
        }
        const cache = pluginClass.app.metadataCache.getFileCache(file);
        if (cache === null || cache.blocks === undefined) {
            return Err(InternalError("No file cache found."));
        }
        const block = cache.blocks[parameters.block];
        if (block === undefined) {
            return Err(NotFoundError(`Failed to find block "${parameters.block}".`));
        }
        view.editor.focus();
        view.editor.setCursor({ line: block.position.start.line, ch: 0 });
    } else {
        // Other wise fallback to open to line.
        await OpenFile(
            {
                file: parameters.filepath,
                setting: pluginClass.settings.openFileWithoutWriteInNewPane,
                parameters: parameters
            },
            pluginClass.app
        );
        if (
            parameters.line != undefined ||
            parameters.column != undefined ||
            parameters.offset != undefined
        ) {
            await SetCursorInLine(parameters, pluginClass.app);
        }
    }
    if (parameters.mode != undefined) {
        await SetCursor(parameters, pluginClass.app);
    }
    if (parameters.writeUid != undefined) {
        const view = pluginClass.app.workspace.getActiveViewOfType<MarkdownView>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            MarkdownView as any
        );
        if (!view) {
            return Err(InternalError("No active view found."));
        }
        const file = view.file;
        if (file === null) {
            return Err(InternalError("No file in active view found."));
        }

        await pluginClass.tools.writeUIDIfNone(file, parameters.uid);
    }
    return Ok();
}
