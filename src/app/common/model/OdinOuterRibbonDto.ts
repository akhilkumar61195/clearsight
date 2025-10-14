export class OdinOuterRibbonDto {
  month: number;
  pType: string;
  whatIf: boolean;
  showContingency: boolean;
  SelectedProjects: Array<string>;
  SelectedWells: Array<string>;
  SelectedScenario?:number;
  SelectedInventory?:number;
}
