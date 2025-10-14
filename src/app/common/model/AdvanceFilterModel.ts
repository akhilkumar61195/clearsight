export class AdvanceFilterModel {
    projects?: Array<string>;
    functions?: number;
    timeline?: string;
    wells?: Array<string>;

    constructor() {
        this.projects = [];
        this.functions = 0;
        this.timeline = "";
        this.wells = [];
    }
}
