export class Tag {
  public constructor(public text: string) {}

  public get sprintName(): string | undefined {
    const m = this.text.match(/(Sprint \d+)/);
    if (m?.[1]) {
      return m[1];
    }
    return undefined;
  }

  public get sprintNumber(): number | undefined {
    const m = this.text.match(/Sprint (\d+)/);
    if (m?.[1]) {
      return parseInt(m[1], 10);
    }
    return undefined;
  }

  public get sprintSuffix(): string | undefined {
    const m = this.text.match(/Sprint \d+([-+!])/);
    if (m?.[1]) {
      return m[1];
    }
    return undefined;
  }
}
