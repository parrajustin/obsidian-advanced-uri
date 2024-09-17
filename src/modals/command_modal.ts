import type { Command } from "obsidian";
import { FuzzySuggestModal } from "obsidian";
import type AdvancedURI from "../main";

export class CommandModal extends FuzzySuggestModal<Command> {
    plugin: AdvancedURI;
    file?: string;
    constructor(plugin: AdvancedURI, file?: string) {
        super(plugin.app);
        this.plugin = plugin;
        this.file = file;
    }

    /** Gets all possibly suggested items. */
    public getItems(): Command[] {
        const rawCommands = this.app.commands.commands;
        const commands: Command[] = Object.keys(rawCommands).map((e) => {
            const command = rawCommands[e] as Command;
            return { id: command.id, name: command.name };
        });
        return commands;
    }

    /** Gets for a suggestion item what is the text to represent it. */
    public getItemText(item: Command): string {
        return item.name;
    }

    /** On choosing an item copies the URI to clipboard. */
    public async onChooseItem(item: Command, _: MouseEvent | KeyboardEvent): Promise<void> {
        if (this.file === undefined) {
            return;
        }
        await this.plugin.tools.copyURI({
            filepath: this.file,
            commandid: item.id,
            uid: ""
        });
    }
}
