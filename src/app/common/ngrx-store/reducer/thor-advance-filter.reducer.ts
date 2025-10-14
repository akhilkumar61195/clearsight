import { ThorAdvanceFilterAction, READ_THOR_ADVANCE_FILTER_ACTION_TYPE, thorFilterObject } from "../action/thor-advance-filter.action";

export interface IThorFilterPayloadStore {
    thorFilterPayload: thorFilterObject
}

const intialState = {
    thorFilterPayload: null
} as IThorFilterPayloadStore;

export function thorAdvanceFilterReducer(state = intialState, action: ThorAdvanceFilterAction) {
    switch (action.type) {
        case READ_THOR_ADVANCE_FILTER_ACTION_TYPE:
            return { ...state, thorFilterPayload: action.payload };
        default:
            return intialState;
    }
}
