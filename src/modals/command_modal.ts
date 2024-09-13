import type { Command } from "obsidian";
import { FuzzySuggestModal } from "obsidian";
import type AdvancedURI from "../main";

export class CommandModal extends FuzzySuggestModal<Command> {
    plugin: AdvancedURI;
    file: string;
    constructor(plugin: AdvancedURI, file?: string) {
        super(plugin.app);
        this.plugin = plugin;
        this.file = file;
    }

    /** Gets all possibly suggested items. */
    getItems(): Command[] {
        const rawCommands = this.app.commands.commands;
        const commands: Command[] = Object.keys(rawCommands).map((e) => {
            return { id: rawCommands[e].id, name: rawCommands[e].name };
        });
        return commands;
    }

    /** Gets for a suggestion item what is the text to represent it. */
    getItemText(item: Command): string {
        return item.name;
    }

    /** On choosing an item copies the URI to clipboard. */
    onChooseItem(item: Command, _: MouseEvent | KeyboardEvent): void {
        this.plugin.tools.copyURI({
            filepath: this.file,
            commandid: item.id
        });
    }
}
