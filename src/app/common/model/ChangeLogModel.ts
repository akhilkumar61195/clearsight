import { IChangeLog } from "./IchangeLog";

export class ChangeLogLibrary   {
 
  private changelogLibrary : IChangeLog[]
  
  setChangeLog(changelogLib:IChangeLog[]){
    this.changelogLibrary=changelogLib;
  }
  getChangeLog() :IChangeLog[]{
   return this.changelogLibrary;
  }
};



