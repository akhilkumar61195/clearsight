import { Action } from "@ngrx/store";

export const READ_ODIN_ADVANCE_FILTER_ACTION_TYPE = 'READ_ODIN_ADVANCE_FILTER';

export type OdinAdvanceFilterActionType = 'READ_ODIN_ADVANCE_FILTER';

export class OdinAdvanceFilterAction implements Action {
    type: OdinAdvanceFilterActionType;

    constructor(public payload: odinFilterObject) {
    }
}

export class odinFilterObject {
    public filterData?: any;
}