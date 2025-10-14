export class odinAdvanceFilterModel {
    projects?: Array<string>;
    functions?: Array<string>;
    timeline?: string;
    wells?: Array<string>;

    constructor() {
        this.projects = [];
        this.functions = [];
        this.timeline = "";
        this.wells = [];
    }
}