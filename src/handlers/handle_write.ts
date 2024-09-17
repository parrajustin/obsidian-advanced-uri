import { TFile } from "obsidian";
import type { OpenExistingFileAndSetCursorParams } from "src/filesystem";
import { Append, Prepend, WriteAndOpenFile } from "src/filesystem";
import type AdvancedURI from "src/main";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import { InternalError, NotFoundError } from "../lib/status_error";

/** URI params for writing. */
export interface WriteUriParams extends OpenExistingFileAndSetCursorParams {
    type: "write";
    /** File path of file to open. */
    filepath: string;
    /** Mode to open file. */
    mode?: "new" | "append" | "prepend" | "overwrite";
    /** data to write. */
    data: string;
    /** If the uid should be added to frontmatter. */
    writeUid?: boolean;
    /** If specified this is written as the uid. */
    uid?: string;
}

/** Handles writing to a file. */
export async function HandleWrite(
    parameters: WriteUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    // Check if there is a file and not a folder, or nothing at all.
    let file: TFile | null = null;
    if (parameters.filepath) {
        const tempFile = pluginClass.app.vault.getAbstractFileByPath(parameters.filepath);
        if (!(tempFile instanceof TFile)) {
            return Err(InternalError(`File "${parameters.filepath}" is not a file.`));
        }
        file = tempFile;
    } else {
        file = pluginClass.app.workspace.getActiveFile();
    }

    // For `new` and `overwrite` modes the file does not matter.
    if (parameters.mode === "new" || parameters.mode === "overwrite") {
        const outFile = await WriteAndOpenFile(
            parameters.filepath,
            parameters.data,
            parameters,
            pluginClass.app,
            pluginClass.settings
        );
        if (outFile.err) {
            return outFile;
        }
        if (parameters.writeUid !== undefined && parameters.writeUid) {
            await pluginClass.tools.writeUIDIfNone(outFile.safeUnwrap(), parameters.uid);
        }
        return Ok();
    }

    // Other modes require the file exists.
    if (file === null) {
        return Err(NotFoundError(`For mode "${parameters.mode}" a valid file is required.`));
    }

    let outFile: TFile | undefined;
    switch (parameters.mode) {
        case "append": {
            const appendResult = await Append(
                file,
                parameters,
                pluginClass.app,
                pluginClass.settings
            );
            if (appendResult.err) {
                return appendResult;
            }
            outFile = appendResult.safeUnwrap();
            break;
        }
        case "prepend": {
            const prependResult = await Prepend(
                file,
                parameters,
                pluginClass.app,
                pluginClass.settings
            );
            if (prependResult.err) {
                return prependResult;
            }
            outFile = prependResult.safeUnwrap();
            break;
        }
        case undefined:
            break;
    }

    // Write uid if necessary.
    if (parameters.writeUid != undefined && parameters.writeUid && outFile !== undefined) {
        await pluginClass.tools.writeUIDIfNone(outFile, parameters.uid);
    }
    return Ok();
}
