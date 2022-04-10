// Credit : https://github.com/oleeskild/obsidian-digital-garden/ @oleeskild


export class ShareStatusBar {
    statusBarItem: HTMLElement;
    counter: number;
    numberOfNotesToPublish: number;

    status: HTMLElement;
    constructor(statusBarItem: HTMLElement, numberOfNotesToPublish: number) {
        this.statusBarItem = statusBarItem;
        this.counter = 0;
        this.numberOfNotesToPublish = numberOfNotesToPublish;


        this.statusBarItem.createEl("span", { text: "Mkdocs Publication: " });
        this.status = this.statusBarItem.createEl("span", { text: `${this.numberOfNotesToPublish} files marked for sharing` });
    }

    increment() {

        this.status.innerText = `⌛Sharing Notes: ${++this.counter}/${this.numberOfNotesToPublish}`;
    }

    finish(displayDurationMillisec: number) {
        this.status.innerText = `✅ Published Notes: ${this.counter}/${this.numberOfNotesToPublish}`;
        setTimeout(() => {
            this.statusBarItem.remove();
        }, displayDurationMillisec);

    }

    error(){
        this.statusBarItem.remove();
    }
}
