import type { AdvancedURISettings } from "./types";

export const DEFAULT_SETTINGS: AdvancedURISettings = {
    openFileOnWrite: true,
    openDailyInNewPane: false,
    openFileOnWriteInNewPane: false,
    openFileWithoutWriteInNewPane: false,
    idField: "id",
    useUID: false,
    addFilepathWhenUsingUID: false,
    allowEval: false,
    includeVaultName: true,
    vaultParam: "name",
    enabledForeignTypes: []
};

/** The url for advanced uri links. */
export const URI_LINK = "uri-link";
