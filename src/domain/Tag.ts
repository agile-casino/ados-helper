
export class Tag {
    public constructor(public text: string) {
    }

    public get sprintName(): string | undefined {
        const m = this.text.match(/(Sprint \d+)/);
        if (m && m[1]) {
            return m[1];
        }
    }

    public get sprintNumber(): number | undefined {
        const m = this.text.match(/Sprint (\d+)/);
        if (m && m[1]) {
            return parseInt(m[1]);
        }
    }

    public get sprintSuffix(): string | undefined {
        const m = this.text.match(/Sprint \d+([-+!])/);
        if (m && m[1]) {
            return m[1];
        }
    }
}
