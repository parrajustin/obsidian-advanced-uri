import type { App, TFile } from "obsidian";
import { GetEndAndBeginningOfHeading } from "src/utils";
import type { OpenExistingFileAndSetCursorParams } from "./open_existing_file_and_set_cursor";
import type { AdvancedURISettings } from "src/types";
import { WriteAndOpenFile } from "./write_and_open_file";
import { NotFoundError, type StatusError } from "../lib/status_error";
import type { Result } from "../lib/result";
import { Err } from "../lib/result";

export interface AppendParams extends OpenExistingFileAndSetCursorParams {
    /** Heading to add text before. */
    heading?: string;
    /** Data to write. */
    data: string;
    /** If `heading` is not specified the data will be added before this line. */
    line?: number;
}

/** Appends data after the specified data, defaults to adding to end of file. */
export async function Append(
    file: TFile,
    parameters: AppendParams,
    app: App,
    settings: AdvancedURISettings
): Promise<Result<TFile, StatusError>> {
    let path: string;
    let dataToWrite: string;
    if (parameters.heading) {
        path = file.path;
        const blockLineInfo = GetEndAndBeginningOfHeading(app, file, parameters.heading);
        if (blockLineInfo === undefined) {
            return Err(NotFoundError(`Failed to find block for heading "${parameters.heading}".`));
        }

        const data = await app.vault.read(file);
        const lines = data.split("\n");

        lines.splice(blockLineInfo.lastLine, 0, ...parameters.data.split("\n"));
        dataToWrite = lines.join("\n");
    } else {
        path = file.path;
        const fileData = await app.vault.read(file);
        if (parameters.line) {
            const line = Math.max(Number(parameters.line), 0);
            const lines = fileData.split("\n");
            lines.splice(line, 0, parameters.data);
            dataToWrite = lines.join("\n");
        } else {
            dataToWrite = fileData + "\n" + parameters.data;
        }
    }
    return WriteAndOpenFile(path, dataToWrite, parameters, app, settings);
}
