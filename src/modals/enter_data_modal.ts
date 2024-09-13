import { SuggestModal } from "obsidian";
import type AdvancedURI from "../main";
import type { EnterData, Parameters } from "../types";

/** A modal to suggest the following write modes into a file. */
export class EnterDataModal extends SuggestModal<EnterData> {
    plugin: AdvancedURI;
    //null if for normal write mode, its not associated with a special mode like "append" or "prepend"
    modes = [null, "overwrite", "append", "prepend"];

    constructor(
        plugin: AdvancedURI,
        private file: string
    ) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder(
            "Type your data to be written to the file or leave it empty to just open it"
        );
    }

    /** Ran everytime text is written into the suggestion view. */
    getSuggestions(query: string): EnterData[] {
        const suggestions: EnterData[] = [];
        for (const mode of this.modes) {
            if (mode === "overwrite" && query === "") {
                continue;
            }

            /** Text to display in the suggestion view. */
            let display: string;
            if (query === "") {
                if (mode) {
                    display = `Write "${query}" in ${mode} mode`;
                } else {
                    display = `Write "${query}"`;
                }
            } else {
                if (mode) {
                    display = `Open in ${mode} mode`;
                } else {
                    display = `Open`;
                }
            }

            suggestions.push({
                data: query,
                display: display,
                mode: mode,
                func: () => {
                    if (this.file) {
                        this.plugin.tools.copyURI({
                            filepath: this.file,
                            data: query,
                            mode: mode as Parameters["mode"]
                        });
                    } else {
                        this.plugin.tools.copyURI({
                            daily: "true",
                            data: query,
                            mode: mode as Parameters["mode"]
                        });
                    }
                }
            });
        }

        return suggestions;
    }

    /** What to render for a suggested item. */
    renderSuggestion(value: EnterData, el: HTMLElement): void {
        el.innerText = value.display;
    }

    /** What to do on suggestion chosen. */
    onChooseSuggestion(item: EnterData): void {
        item.func();
    }
}
