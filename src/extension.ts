import type { TreeDataProvider, TreeItem, ProviderResult, ExtensionContext } from 'vscode'
import * as vs from 'vscode'
import nodeUtil from 'node:util'
import * as cp from 'child_process'

const cliStepRegex = /(.+?)(?:\s{2,})(.*)/
const exec = nodeUtil.promisify(cp.exec)

class StepsProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData = new vs.EventEmitter<void>()
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event

	private steps: TreeItem[] = []

	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element
	}

	getChildren(): ProviderResult<TreeItem[]> {
		return this.steps
	}

	updateSteps(steps: TreeItem[]) {
		this._onDidChangeTreeData.fire()
		this.steps.splice(0, this.steps.length, ...steps)
	}
}

async function getSteps(zigPath: string, cwd: string) {
	const { stdout, stderr } = await exec(zigPath + ' build --help', { cwd })
	if (stderr != '') return []

	let start = false
	let id = 0

	const steps: TreeItem[] = []

	for (const line of stdout.split('\n')) {
		if (start) {
			if (line == '') break

			const match = line.trim().match(cliStepRegex)
			if (!match) continue
			
			id++
			let title = match[1]
			const description = match[2]

			if (id == 1 && title.endsWith(" (default)")) {
				const index = title.lastIndexOf(" (default)")
				title = title.substring(0, index)
			}

			steps.push({
				id: id.toString(),
				label: title,
				tooltip: description,
				command: {
					title: '',
					command: 'zigStepsView.buildStep',
					arguments: [title]
				}
			})
		}

		if (line == 'Steps:') {
			start = true
			continue
		}
	}

	return steps
}

export function activate(context: ExtensionContext) {
	const zigExtension = vs.extensions.getExtension('ziglang.vscode-zig')
	if (!zigExtension) {
		console.log("BRUH zigExtension")
		return
	}

	const zigConfig = vs.workspace.getConfiguration('zig')
	const zigPath = zigConfig.get<string | undefined>('path')
	if (!zigPath) {
		console.log("BRUH zigPath")
		return
	}

	const workspaceFolders = vs.workspace.workspaceFolders!
	const cwd = workspaceFolders[0].uri.fsPath
	const provider = new StepsProvider()

	context.subscriptions.push(
		vs.commands.registerCommand("zigStepsView.buildStep", (arg: string) => {
			const terminal = vs.window.createTerminal()
			terminal.show()
			terminal.sendText(zigPath + ' build ' + arg)
		}),

		vs.window.registerTreeDataProvider(
			'zigStepsView',
			provider
		),

		vs.workspace.onDidSaveTextDocument((document) => {
			if (document.uri.fsPath.endsWith('build.zig')) {
				getSteps(zigPath, cwd).then((steps) => {
					provider.updateSteps(steps)
					vs.commands.executeCommand('setContext', 'zigStepsReady', true)
				})
			}
		})
	)

	getSteps(zigPath, cwd).then((steps) => {
		provider.updateSteps(steps)
		vs.commands.executeCommand('setContext', 'zigStepsReady', true)
	})
}

export function deactivate() {

}