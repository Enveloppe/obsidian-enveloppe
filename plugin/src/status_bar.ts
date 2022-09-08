// Credit : https://github.com/oleeskild/obsidian-digital-garden/ @oleeskild

export class ShareStatusBar {
	statusBarItem: HTMLElement;
	counter: number;
	numberOfNotesToPublish: number;
	attachment = false;

	status: HTMLElement;
	constructor (statusBarItem: HTMLElement, numberOfNotesToPublish: number, attachment=false) {
		this.statusBarItem = statusBarItem
		this.counter = 0
		this.numberOfNotesToPublish = numberOfNotesToPublish
		this.attachment = attachment

		this.statusBarItem.createEl('span', { text: '' })
		let msg = `${this.numberOfNotesToPublish} files marked for sharing`
		if (this.attachment) {
			msg = `${this.numberOfNotesToPublish} attachments linked`
		}
		this.status = this.statusBarItem.createEl('span', { text: `${msg}` })
	}

	increment () {
		let msg = `⌛Sharing files`
		if (this.attachment) {
			msg = `⌛Sharing attachments`
		}
		this.status.setText(`${msg}: ${++this.counter}/${this.numberOfNotesToPublish}`)
	}

	finish (displayDurationMillisec: number) {
		let msg = `✅ Published files`
		if (this.attachment) {
			msg = `✅ Shared attachments`
		}
		this.status.setText(`${msg}: ${this.counter}/${this.numberOfNotesToPublish}`)
		setTimeout(() => {
			this.statusBarItem.remove()
		}, displayDurationMillisec)
	}

	error () {
		this.statusBarItem.remove()
	}
}
