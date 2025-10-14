export function builtSearchConditionForCompletionDashboard(self: any) {
  
  let searchConditions: any = [];
  if (self && self.selectedWells && self.selectedWells.length)
    searchConditions.push({ "FieldName": "WellNumber", "Operator": "oneof", "Value": self.selectedWells.toString() });

  if (self.groupSelected != "") {
    self.groupSelected = self.groupSelected == '(blank)' ? '' : self.groupSelected;
    searchConditions.push({ "FieldName": "GroupName", "Operator": "oneof", "Value": self.groupSelected.toString(), "FieldType": "string" });
  }

  if (self.odSelected != "")
    searchConditions.push({ "FieldName": "NominalOD1", "Operator": "oneof", "Value": self.odSelected.toString(), "FieldType": "string" });

  if (self.componentTypeSelected != "")
    searchConditions.push({ "FieldName": "ComponentTypeId", "Operator": "oneof", "Value": self.componentTypeSelected.toString(), "FieldType": "string" });

  if (self.supplierSelected != "")
    searchConditions.push({ "FieldName": "OrganizationID", "Operator": "oneof", "Value": self.supplierSelected.toString(), "FieldType": "string" });

  if (self.weightsSelected != "")
    searchConditions.push({ "FieldName": "Weight1", "Operator": "oneof", "Value": self.weightsSelected.toString(), "FieldType": "string" });

  if (self.gradeSelected != "")
    searchConditions.push({ "FieldName": "MaterialGradeID1", "Operator": "oneof", "Value": self.gradeSelected.toString(), "FieldType": "string" });

  if (self.connectionSelected != "")
    searchConditions.push({ "FieldName": "TopendConnectionID", "Operator": "oneof", "Value": self.connectionSelected.toString(), "FieldType": "string" });

  if (self.filters) {
  

    if (self.filters.grades && self.filters.grades.toString() != "")
      searchConditions.push({ "FieldName": "Grade", "Operator": "oneof", "Value": self.filters.grades.toString(), "FieldType": "string" });

    if (self.filters.connections && self.filters.connections.toString() != "")
      searchConditions.push({ "FieldName": "Connection", "Operator": "oneof", "Value": self.filters.connections.toString(), "FieldType": "string" });

  }
  return searchConditions;
}

export function builtSearchConditionForCompletionTimeLineView(self: any) {
  let searchConditions: any = [];
 
  if (self) {
    if (self.selectedComponentType && self.selectedComponentType.toString() != "")
      searchConditions.push({ "FieldName": "ComponentTypeId", "Operator": "oneof", "Value": self.selectedComponentType.toString(), "FieldType": "string" });

    if (self.selectedWeights && self.selectedWeights.toString() != "")
      searchConditions.push({ "FieldName": "Weight1", "Operator": "oneof", "Value": self.selectedWeights.toString(), "FieldType": "decimal" });

    if (self.selectedGrades && self.selectedGrades.toString() != "")
      searchConditions.push({ "FieldName": "Grade", "Operator": "oneof", "Value": self.selectedGrades.toString(), "FieldType": "string" });

    if (self.selectedConnections && self.selectedConnections.toString() != "")
      searchConditions.push({ "FieldName": "TopendConnectionID", "Operator": "oneof", "Value": self.selectedConnections.toString(), "FieldType": "string" });

    if (self.selectedSupplier && self.selectedSupplier.toString() != "")
      searchConditions.push({ "FieldName": "OrganizationID", "Operator": "oneof", "Value": self.selectedSupplier.toString(), "FieldType": "string" });

   
    if (self.selectedGroups && self.selectedGroups.toString() != "")
      searchConditions.push({ "FieldName": "GroupName", "Operator": "oneof", "Value": self.selectedGroups.toString(), "FieldType": "string" });

    if (self.selectedODs && self.selectedODs.toString() != "")
      searchConditions.push({ "FieldName": "NominalOD1", "Operator": "oneof", "Value": self.selectedODs.toString(), "FieldType": "string" });
  }
  return searchConditions;
}