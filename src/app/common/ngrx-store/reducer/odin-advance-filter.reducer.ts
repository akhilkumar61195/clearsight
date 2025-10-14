import { OdinAdvanceFilterAction, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE, odinFilterObject } from "../action/odin-advance-filter.action";

export interface IOdinFilterPayloadStore {
    odinFilterPayload: odinFilterObject
}

const intialState = {
    odinFilterPayload: null
} as IOdinFilterPayloadStore;

export function odinAdvanceFilterReducer(state = intialState, action: OdinAdvanceFilterAction) {
    switch (action.type) {
        case READ_ODIN_ADVANCE_FILTER_ACTION_TYPE:
            return { ...state, odinFilterPayload: action.payload };
        default:
            return intialState;
    }
}
