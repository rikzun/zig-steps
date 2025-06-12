import type { WorkspaceConfiguration } from 'vscode'
import * as vs from 'vscode'
import { extensionID } from './main'

export class Config {
    private static get config(): WorkspaceConfiguration {
        return vs.workspace.getConfiguration(extensionID)
    }

    static get zigPath() {
        return this.config.get<string>('zigPath') ?? 'zig'
    }

    static get excludedSteps() {
        return this.config.get<string[]>('excludedSteps') ?? []
    }

    static get descriptionInTooltip() {
        return this.config.get<boolean>('descriptionInTooltip') ?? true
    }

    static get descriptionInDescription() {
        return this.config.get<boolean>('descriptionInDescription') ?? false
    }
}