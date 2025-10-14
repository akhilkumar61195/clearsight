export function builtSearchCondition(self: any) {
  let searchConditions: any = [];
  if (self && self.selectedWells && self.selectedWells.length)
    searchConditions.push({ "FieldName": "WellNumber", "Operator": "oneof", "Value": self.selectedWells.toString() });

  if (self.sourServiceSelected != "")
    searchConditions.push({ "FieldName": "SourService", "Operator": "oneof", "Value": self.sourServiceSelected.toString(), "FieldType": "string" });

  if (self.groupSelected != "") {
    self.groupSelected = self.groupSelected == '(blank)' ? '' : self.groupSelected;
    searchConditions.push({ "FieldName": "MGroup", "Operator": "oneof", "Value": self.groupSelected.toString(), "FieldType": "string" });
  }

  if (self.odSelected != "")
    searchConditions.push({ "FieldName": "OD", "Operator": "oneof", "Value": self.odSelected.toString(), "FieldType": "string" });

  if (self.materialTypeSelected != "")
    searchConditions.push({ "FieldName": "MaterialType", "Operator": "oneof", "Value": self.materialTypeSelected.toString(), "FieldType": "string" });

  if (self.vendorSelected != "")
    searchConditions.push({ "FieldName": "Vendor", "Operator": "oneof", "Value": self.vendorSelected.toString(), "FieldType": "string" });

  if (self.weightsSelected != "")
    searchConditions.push({ "FieldName": "Weight", "Operator": "oneof", "Value": self.weightsSelected.toString(), "FieldType": "string" });

  if (self.gradeSelected != "")
    searchConditions.push({ "FieldName": "Grade", "Operator": "oneof", "Value": self.gradeSelected.toString(), "FieldType": "string" });

  if (self.connectionSelected != "")
    searchConditions.push({ "FieldName": "connection", "Operator": "oneof", "Value": self.connectionSelected.toString(), "FieldType": "string" });

  if (self.filters) {
    // if (self.filters.materialTypes && self.filters.materialTypes.toString() != "")
    //   searchConditions.push({ "FieldName": "MaterialType", "Operator": "oneof", "Value": self.filters.materialTypes.toString(), "FieldType": "string" });

    // if (self.filters.weights && self.filters.weights.toString() != "")
    //   searchConditions.push({ "FieldName": "Weight", "Operator": "oneof", "Value": self.filters.weights.toString(), "FieldType": "decimal" });

    if (self.filters.grades && self.filters.grades.toString() != "")
      searchConditions.push({ "FieldName": "Grade", "Operator": "oneof", "Value": self.filters.grades.toString(), "FieldType": "string" });

    if (self.filters.connections && self.filters.connections.toString() != "")
      searchConditions.push({ "FieldName": "Connection", "Operator": "oneof", "Value": self.filters.connections.toString(), "FieldType": "string" });

    //   if (self.filters.vendors && self.filters.vendors.toString() != "")
    //     searchConditions.push({ "FieldName": "Vendor", "Operator": "oneof", "Value": self.filters.vendors.toString(), "FieldType": "string" });
    // 
  }
  return searchConditions;
}

export function builtSearchConditionForTimeLineView(self: any) {
  let searchConditions: any = [];
  // if (self && self.searchSelected && self.searchSelected.length)
  //   searchConditions.push({ "FieldName": "well", "Operator": "oneof", "Value": self.searchSelected.toString() });

  if (self) {
    if (self.selectedMaterialType && self.selectedMaterialType.toString() != "")
      searchConditions.push({ "FieldName": "MaterialType", "Operator": "oneof", "Value": self.selectedMaterialType.toString(), "FieldType": "string" });

    if (self.selectedWeights && self.selectedWeights.toString() != "")
      searchConditions.push({ "FieldName": "Weight", "Operator": "oneof", "Value": self.selectedWeights.toString(), "FieldType": "decimal" });

    if (self.selectedGrades && self.selectedGrades.toString() != "")
      searchConditions.push({ "FieldName": "Grade", "Operator": "oneof", "Value": self.selectedGrades.toString(), "FieldType": "string" });

    if (self.selectedConnections && self.selectedConnections.toString() != "")
      searchConditions.push({ "FieldName": "Connection", "Operator": "oneof", "Value": self.selectedConnections.toString(), "FieldType": "string" });

    if (self.selectedVendors && self.selectedVendors.toString() != "")
      searchConditions.push({ "FieldName": "Vendor", "Operator": "oneof", "Value": self.selectedVendors.toString(), "FieldType": "string" });

    if (self.selectSourServices && self.selectSourServices.toString() != "")
      searchConditions.push({ "FieldName": "SourService", "Operator": "oneof", "Value": self.selectSourServices.toString(), "FieldType": "string" });

    if (self.selectedGroups && self.selectedGroups.toString() != "")
      searchConditions.push({ "FieldName": "MGroup", "Operator": "oneof", "Value": self.selectedGroups.toString(), "FieldType": "string" });

    if (self.selectedODs && self.selectedODs.toString() != "")
      searchConditions.push({ "FieldName": "OD", "Operator": "oneof", "Value": self.selectedODs.toString(), "FieldType": "string" });
  }
  return searchConditions;
}