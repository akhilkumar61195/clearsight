export class thorAdvanceFilterModel {
    projects?: Array<string>;
    functions?: Array<string>;
    timeline?: string;
    well?: number;
    globalSearch?: string;

    thorAdvanceFilterModel() {
        this.projects = [];
        this.functions = [];
        this.well = 0;
        this.globalSearch="";
    }
}