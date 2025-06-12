import type { TreeDataProvider, TreeItem } from 'vscode'
import vs from 'vscode'
import { Config } from './config'

export class StepsProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData = new vs.EventEmitter<void>()
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event

	private loader: boolean = false
	private loaderResolve: () => void = () => {}

	private steps: TreeItem[] = []
	private excludedSteps: string[] = []

	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element
	}

	async getChildren(): Promise<TreeItem[]> {
		if (this.loader) {
			await new Promise((resolve) => {
				this.loaderResolve = resolve as () => void
			})
		}

		let steps = this.steps
		if (this.excludedSteps.length) {
			steps = steps.filter((v) => {
				return !this.excludedSteps.includes(v.label as string)
			})
		}

		const descriptionInTooltip = Config.descriptionInTooltip
		const descriptionInDescription = Config.descriptionInDescription

		return steps.map((v) => {
			const step = {...v}

			if (descriptionInDescription) step.description = step.tooltip as string
			if (!descriptionInTooltip) step.tooltip = ''
			return step
		})
	}

	updateSteps(steps: TreeItem[]) {
		this.loader = false
		this.loaderResolve()

		this.steps.splice(0, this.steps.length, ...steps)
		this._onDidChangeTreeData.fire()
	}

	excludeSteps(names: string[]) {
		this.excludedSteps.splice(0, this.excludedSteps.length, ...names)
		this._onDidChangeTreeData.fire()
	}

	blur(id: string) {
		const element = this.steps.find((v) => v.id == id)
		if (!element) return

		element.id = "-1"
		this._onDidChangeTreeData.fire()

		setTimeout(() => {
			element.id = id
			this._onDidChangeTreeData.fire()
		}, 50)
	}

	turnLoader() {
		this.loader = true
		this._onDidChangeTreeData.fire()
	}

	updateDescription() {
		this._onDidChangeTreeData.fire()
	}
}