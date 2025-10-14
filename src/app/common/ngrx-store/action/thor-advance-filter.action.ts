import { Action } from "@ngrx/store";

export const READ_THOR_ADVANCE_FILTER_ACTION_TYPE = 'READ_THOR_ADVANCE_FILTER';

export type ThorAdvanceFilterActionType = 'READ_THOR_ADVANCE_FILTER';

export class ThorAdvanceFilterAction implements Action {
    type: ThorAdvanceFilterActionType;

    constructor(public payload: thorFilterObject) {
    }
}

export class thorFilterObject {
    public filterData?: any;
}