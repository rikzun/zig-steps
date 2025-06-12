import nodeUtil from 'node:util'
import { exec as cpExec } from 'child_process'
import type { TreeItem } from 'vscode'

const cliStepRegex = /(.+?)(?:\s{2,})(.*)/
const exec = nodeUtil.promisify(cpExec)

export async function getSteps(zigPath: string, cwd: string) {
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
				tooltip: description
			})
		}

		if (line == 'Steps:') {
			start = true
			continue
		}
	}

	return steps
}