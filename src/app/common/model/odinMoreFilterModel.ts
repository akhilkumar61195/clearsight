export class odinMoreFilterModel {
    materialTypes?: Array<string>;
    weights?: Array<string>;
    grades?: Array<string>;
    connections?: Array<string>;
    vendors?: Array<string>;

    constructor() {
        this.materialTypes = [];
        this.weights = [];
        this.grades = [];
        this.connections = [];
        this.vendors = [];
    }
}

export class odinTimeLineViewMoreFilterModel {
    materialTypes?: Array<string>;
    weights?: Array<string>;
    grades?: Array<string>;
    connections?: Array<string>;
    vendors?: Array<string>;
    groups?: Array<string>;
    ods?: Array<string>;
    sourServices?: Array<string>;

    constructor() {
        this.materialTypes = [];
        this.weights = [];
        this.grades = [];
        this.connections = [];
        this.vendors = [];
        this.groups = [];
        this.ods = [];
        this.sourServices = [];
    }
}