import type { AdvancedURISettings, OpenMode } from "src/types";
import { SetCursorInLine, type SetCursorInLineParams } from "./set_cursor_in_line";
import { OpenFile } from "./open_file";
import type { App } from "obsidian";
import type { StatusError } from "../lib/status_error";
import { InvalidArgumentError } from "../lib/status_error";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";

export interface OpenExistingFileAndSetCursorParams extends SetCursorInLineParams {
    openmode?: OpenMode;
}

/** Opens the given file and sets the cursor. */
export async function OpenExistingFileAndSetCursor(
    file: string,
    parameters: OpenExistingFileAndSetCursorParams,
    app: App,
    settings: AdvancedURISettings
): Promise<StatusResult<StatusError>> {
    if (parameters.openmode == "silent") {
        return Err(InvalidArgumentError('"openmode" is "silent"'));
    }
    if (settings.openFileOnWrite) {
        await OpenFile(
            {
                file: file,
                setting: settings.openFileOnWriteInNewPane,
                parameters
            },
            app
        );
        if (
            parameters.line != undefined ||
            parameters.column != undefined ||
            parameters.offset != undefined
        ) {
            await SetCursorInLine(parameters, app);
        }
    }
    return Ok();
}
