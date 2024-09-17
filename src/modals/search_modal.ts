import { SuggestModal } from "obsidian";
import type AdvancedURI from "../main";
import type { SearchModalData } from "../types";

export class SearchModal extends SuggestModal<SearchModalData> {
    plugin: AdvancedURI;

    constructor(plugin: AdvancedURI) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder("Searched text. RegEx is supported");
    }

    public getSuggestions(query: string): SearchModalData[] {
        if (query === "") {
            query = "...";
        }
        let regex: RegExp | undefined;
        try {
            regex = new RegExp(query);
        } catch (error) {
            console.error(`failed to compile ${query}`, error);
        }
        return [
            {
                source: query,
                isRegEx: false,
                display: query
            },
            {
                source: query,
                display: regex ? `As RegEx: ${query}` : `Can't parse RegEx`,
                isRegEx: true
            }
        ];
    }

    public renderSuggestion(value: SearchModalData, el: HTMLElement): void {
        el.innerText = value.display;
    }

    public onChooseSuggestion(_data: SearchModalData, _mouse: MouseEvent | KeyboardEvent): void {}
}
