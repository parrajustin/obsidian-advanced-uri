import type { App } from "obsidian";
import type { TFile } from "obsidian";
import { GetEndAndBeginningOfHeading } from "../utils";
import { WriteAndOpenFile } from "./write_and_open_file";
import type { AdvancedURISettings } from "src/types";
import type { OpenExistingFileAndSetCursorParams } from "./open_existing_file_and_set_cursor";
import type { StatusError } from "../lib/status_error";
import { NotFoundError } from "../lib/status_error";
import type { Result } from "../lib/result";
import { Err } from "../lib/result";

export interface PrependParams extends OpenExistingFileAndSetCursorParams {
    /** Heading to add text before. */
    heading?: string;
    /** Data to write. */
    data: string;
    /** If `heading` is not specified the data will be added before this line. */
    line?: number;
}

/** Prepend the data before the specified data. Defaults to adding after frontmatter data. */
export async function Prepend(
    file: TFile,
    parameters: PrependParams,
    app: App,
    settings: AdvancedURISettings
): Promise<Result<TFile, StatusError>> {
    let path: string;
    let dataToWrite: string = "";
    if (parameters.heading !== undefined) {
        path = file.path;
        const line = GetEndAndBeginningOfHeading(app, file, parameters.heading);
        if (line === undefined) {
            return Err(NotFoundError(`failed to find headinb block for "${parameters.heading}".`));
        }

        // Get the file lines.
        const data = await app.vault.read(file);
        const fileLines = data.split("\n");

        // Get the full file to write adding the data before the first line of the block.
        fileLines.splice(line.firstLine, 0, ...parameters.data.split("\n"));
        dataToWrite = fileLines.join("\n");
    } else {
        path = file.path;
        const fileData = await app.vault.read(file);
        const cache = app.metadataCache.getFileCache(file);
        let line = 0;
        if (parameters.line) {
            line += Math.max(Number(parameters.line) - 1, 0);
        } else if (cache !== null && cache.frontmatterPosition) {
            line += cache.frontmatterPosition.end.line + 1;
        }
        const lines = fileData.split("\n");
        lines.splice(line, 0, parameters.data);
        dataToWrite = lines.join("\n");
    }

    return WriteAndOpenFile(path, dataToWrite, parameters, app, settings);
}
