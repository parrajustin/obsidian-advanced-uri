import type { App } from "obsidian";
import { base64ToArrayBuffer, TFile, TFolder } from "obsidian";
import type { OpenExistingFileAndSetCursorParams } from "./open_existing_file_and_set_cursor";
import { OpenExistingFileAndSetCursor } from "./open_existing_file_and_set_cursor";
import type { AdvancedURISettings } from "src/types";
import type { StatusError } from "../lib/status_error";
import type { Result } from "../lib/result";
import { Ok } from "../lib/result";

/** Write the data to file and open it. If text is base64 url written as binary data. */
export async function WriteAndOpenFile(
    outputFileName: string,
    text: string,
    parameters: OpenExistingFileAndSetCursorParams,
    app: App,
    settings: AdvancedURISettings
): Promise<Result<TFile, StatusError>> {
    const file = app.vault.getAbstractFileByPath(outputFileName);

    if (file instanceof TFile) {
        // If file found modify it.
        await app.vault.modify(file, text);
    } else {
        const parts = outputFileName.split("/");
        const dir = parts.slice(0, parts.length - 1).join("/");
        if (parts.length > 1 && !(app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
            // Check to see if the parent folder exists.
            await app.vault.createFolder(dir);
        }
        const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (base64regex.test(text)) {
            // If data is base64 write as binary.
            await app.vault.createBinary(outputFileName, base64ToArrayBuffer(text));
        } else {
            // Write text to file.
            await app.vault.create(outputFileName, text);
        }
    }
    // Open the file and set the cursor.
    OpenExistingFileAndSetCursor(outputFileName, parameters, app, settings);

    // Return instance of TFile.
    return Ok(app.vault.getAbstractFileByPath(outputFileName) as TFile);
}
