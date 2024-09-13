import { MarkdownView, TFile } from "obsidian";
import type { SetCursorInLineParams } from "../filesystem";
import { OpenFile, SetCursorInLine } from "../filesystem";
import type AdvancedURI from "../main";
import { getAlternativeFilePath } from "../utils";
import { Ok, type StatusResult } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import type { OpenMode } from "../types";

export interface OpenFileParams extends SetCursorInLineParams {
    /** File path of file to open. */
    filepath?: string;
    /** Mode to open file. */
    mode?: "new" | "append" | "prepend" | "overwrite";
    /** Open mode to open file. */
    openmode?: OpenMode;
}

/**
 * Opens a file util for handlers. This is shared logic from multiple handlers.
 * @param parameters params to open file.
 * @param pluginClass the parent plugin class.
 */
export async function OpenFileHandler(
    parameters: OpenFileParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    // Params to open the file.
    if (parameters.filepath) {
        if (parameters.mode) {
            if (parameters.mode == "new") {
                // TODO: find out what this mode does...
                const file = pluginClass.app.metadataCache.getFirstLinkpathDest(
                    parameters.filepath,
                    "/"
                );
                if (file instanceof TFile) {
                    parameters.filepath = getAlternativeFilePath(pluginClass.app, file);
                }
            }

            const openFileResult = await OpenFile(
                {
                    file: parameters.filepath,
                    mode: "source",
                    parameters: {
                        filepath: parameters.filepath,
                        openmode: parameters.openmode
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
            if (view !== null) {
                const editor = view.editor;
                const data = editor.getValue();
                if (parameters.mode === "append") {
                    editor.setValue(data + "\n");
                    const lines = editor.lineCount();
                    editor.setCursor({ ch: 0, line: lines });
                } else if (parameters.mode === "prepend") {
                    editor.setValue("\n" + data);
                    editor.setCursor({ ch: 0, line: 0 });
                } else if (parameters.mode === "overwrite") {
                    editor.setValue("");
                }
            }
        } else if (
            parameters.line != undefined ||
            parameters.column != undefined ||
            parameters.offset != undefined
        ) {
            const openFileResult = await OpenFile(
                {
                    file: parameters.filepath,
                    mode: "source",
                    parameters: {
                        filepath: parameters.filepath,
                        openmode: parameters.openmode
                    }
                },
                pluginClass.app
            );
            if (openFileResult.err) {
                return openFileResult;
            }

            return await SetCursorInLine(parameters, pluginClass.app);
        } else {
            const openFileResult = await OpenFile(
                {
                    file: parameters.filepath,
                    setting: pluginClass.settings.openFileWithoutWriteInNewPane,
                    parameters: {
                        filepath: parameters.filepath,
                        openmode: parameters.openmode
                    }
                },
                pluginClass.app
            );
            if (openFileResult.err) {
                return openFileResult;
            }
        }
    } else if (parameters.openmode || parameters.viewmode) {
        // Open a new leaf without a file. For example in a new window or split
        const openFileResult = await OpenFile(
            {
                parameters: {
                    filepath: parameters.filepath,
                    openmode: parameters.openmode
                }
            },
            pluginClass.app
        );
        if (openFileResult.err) {
            return openFileResult;
        }
    }
    return Ok();
}
