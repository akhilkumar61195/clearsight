export class AssemblyTypeModel {
    assemblyTypeId: number;
    assemblyTypeName: string;
    dateCreated?: Date;
    dateLastModified?: Date;
    userIdCreatedBy?: string;
    userIdModifiedBy?: string;
    isDeleted?: number;
}
