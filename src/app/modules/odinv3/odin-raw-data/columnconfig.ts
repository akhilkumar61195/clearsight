export class ColumnConfig {
  constructor(
    public field: string,
    public header: string,
    public sortable: boolean,
    public headerColor: string,
    public textColor: string,
    public width?:number
  ) { }
}

export const groupedInventoryCols: ColumnConfig[] = [
  new ColumnConfig('materialId', 'Material ID', true, '#EDEDEE', '#000'),
  new ColumnConfig('generalAccountTotal', 'General Account', true, '#EDEDEE', '#000',600),
  new ColumnConfig('jackandStMaloTotal', 'JSM', true, '#EDEDEE', '#000'),
  new ColumnConfig('tahitiTotal', 'Tahiti', true, '#EDEDEE', '#000'),
  new ColumnConfig('bigFootTotal', 'Big Foot', true, '#EDEDEE', '#000'),
  new ColumnConfig('blindFaithTotal', 'Blind Faith', true, '#EDEDEE', '#000'),
  new ColumnConfig('anchorTotal', 'Anchor', true, '#EDEDEE', '#000'),
  new ColumnConfig('ballymoreTotal', 'Ballymore', true, '#EDEDEE', '#000'),
  new ColumnConfig('surplusTotal', 'Surplus', true, '#EDEDEE', '#000'),
  new ColumnConfig('totals', 'Total', true, '#EDEDEE', '#000'),
];

export const inventoryCols: ColumnConfig[] = [ 
  new ColumnConfig('materialId', 'MaterialID', true, '#EDEDEE', '#000'),
  new ColumnConfig('generalAccount', 'General Account', true, '#EDEDEE', '#000',200),
  new ColumnConfig('jackAndStMalo', 'Jack St. Malo', true, '#EDEDEE', '#000',200),
  new ColumnConfig('tahiti', 'Tahiti', true, '#EDEDEE', '#000'),
  new ColumnConfig('bigFoot', 'Big Foot', true, '#EDEDEE', '#000'),
  new ColumnConfig('blindFaith', 'Blind Faith', true, '#EDEDEE', '#000'),
  new ColumnConfig('anchor', 'Anchor', true, '#EDEDEE', '#000'),
  new ColumnConfig('ballymore', 'Ballymore', true, '#EDEDEE', '#000'),
  new ColumnConfig('surplus', 'Surplus', true, '#EDEDEE', '#000'),
  new ColumnConfig('onHandQuantity', 'OnHandQuantity', true, '#EDEDEE', '#000',200),
  new ColumnConfig('plantCode', 'PlantCode', true, '#EDEDEE', '#000'),
  new ColumnConfig('asset', 'Asset', true, '#EDEDEE', '#000'),
  new ColumnConfig('partnerAuditClaimPlantCode', 'Partner Audit Claim Plant Code', true, '#EDEDEE', '#000',300),
  new ColumnConfig('batch', 'Batch', true, '#EDEDEE', '#000'),
  new ColumnConfig('wbsElementID', 'WBSElementID', true, '#EDEDEE', '#000',200),
  new ColumnConfig('wbsElementDesc', 'WBSElementDesc', true, '#EDEDEE', '#000',210),
  new ColumnConfig('category2Bucket', 'Category2Bucket', true, '#EDEDEE', '#000',210),
  new ColumnConfig('valuationType', 'ValuationType', true, '#EDEDEE', '#000',200),
  new ColumnConfig('materialShortDesc', 'MaterialShortDesc', true, '#EDEDEE', '#000',250),
  new ColumnConfig('unitPriceUsd', 'UnitPriceUSD', true, '#EDEDEE', '#000',210),
  new ColumnConfig('valuationClass', 'ValuationClass', true, '#EDEDEE', '#000',210),
];

export const sapUnitCostCols: ColumnConfig[] = [
  new ColumnConfig('materialId', 'MaterialID', true, '#EDEDEE', '#000'),
  new ColumnConfig('materialShortDesc', 'MaterialShortDesc', true, '#EDEDEE', '#000',300),
  new ColumnConfig('plantCode', 'PlantCode', true, '#EDEDEE', '#000'),
  new ColumnConfig('asset', 'Asset', true, '#EDEDEE', '#000'),
  new ColumnConfig('batch', 'Batch', true, '#EDEDEE', '#000'),
  new ColumnConfig('category2Bucket', 'Category2Bucket', true, '#EDEDEE', '#000',200),
  new ColumnConfig('onHandQuantity', 'OnHandQuantity', true, '#EDEDEE', '#000',200),
  new ColumnConfig('unitPriceUSD', 'UnitPriceUSD', true, '#EDEDEE', '#000', 200),
  new ColumnConfig('identifierByPlant', 'Identifier (By Plant)', true, '#EDEDEE', '#000',250),
  new ColumnConfig('identifierAllPlant', 'Identifier (ALL Plants)', true, '#EDEDEE', '#000',250),
  new ColumnConfig('cummValueByPlant', 'Cumulative Value (By Plant)', true, '#EDEDEE', '#000',250),
  new ColumnConfig('cummQuantityByPlant', 'Cumulative Quantity (By Plant)', true, '#EDEDEE', '#000',300),
  new ColumnConfig('incrementalCostBasisByPlant', 'Incremental Cost Basis (By Plant)', true, '#EDEDEE', '#000',350),
  new ColumnConfig('cummValueAllPlant', 'Cumulative Value (ALL Plants)', true, '#EDEDEE', '#000',350),
  new ColumnConfig('cummQuantityAllPlant', 'Cumulative Quantity (ALL Plants)', true, '#EDEDEE', '#000',300),
  new ColumnConfig('mmCostBasisAvgAllPlant', 'MM# Cost Basis (AVG ALL Plants)', true, '#EDEDEE', '#000',300),
  new ColumnConfig('lastValueByPlant', 'Last Value? (By Plant)', true, '#EDEDEE', '#000',250),
  new ColumnConfig('lastValueAllPlant', 'Last Value? (ALL Plants)', true, '#EDEDEE', '#000',250)
];

//Yard Inventory Columns
export const yardInventoryCols: ColumnConfig[] = [
  new ColumnConfig('materialId', 'Material Number', true, '#EDEDEE', '#000', 180),
  new ColumnConfig('productName', 'Product Name', true, '#EDEDEE', '#000', 170),
  new ColumnConfig('lotOrSerialNumber', 'Lot/Serial Number', true, '#EDEDEE', '#000', 190),
  new ColumnConfig('location', 'Location', true, '#EDEDEE', '#000'),
  new ColumnConfig('stockingLocation', 'Stocking Location', true, '#EDEDEE', '#000', 190),
  new ColumnConfig('length', 'Length', true, '#EDEDEE', '#000'),
  new ColumnConfig('heatNumber', 'Heat Number', true, '#EDEDEE', '#000', 160),
  new ColumnConfig('class', 'Class', true, '#EDEDEE', '#000'),
  new ColumnConfig('condition', 'Condition', true, '#EDEDEE', '#000'),
  new ColumnConfig('accessory', 'Accessory', true, '#EDEDEE', '#000'),
  new ColumnConfig('sonumber', 'SO#', true, '#EDEDEE', '#000'),
  new ColumnConfig('wellName', 'Well Name', true, '#EDEDEE', '#000'),
  new ColumnConfig('wbs', 'WBS', true, '#EDEDEE', '#000'),
  new ColumnConfig('project', 'Project', true, '#EDEDEE', '#000'),
  new ColumnConfig('plantCode', 'Plant Code', true, '#EDEDEE', '#000'),
  new ColumnConfig('sloccode', 'SLOC Code', true, '#EDEDEE', '#000')
];

export const tenarisOrdersCols: ColumnConfig[] = [
  new ColumnConfig('id', '', false, '#EDEDEE', '#000', 200),
  new ColumnConfig('materialId', 'MM #', true, '#EDEDEE', '#000'),
  new ColumnConfig('description', 'Description', true, '#EDEDEE', '#000'),
  new ColumnConfig('transactionType', 'Transaction Type', true, '#EDEDEE', '#000'),
  new ColumnConfig('quantity', 'Quantity', true, '#EDEDEE', '#000'),
  new ColumnConfig('unitPrice', 'Unit Price (USD)', true, '#EDEDEE', '#000'),
  new ColumnConfig('expectedDeliveryDate', 'Estimated Delivery Date', true, '#EDEDEE', '#000')
];

export const valluorecOrdersCols: ColumnConfig[] = [
  new ColumnConfig('id', '', false, '#EDEDEE', '#000', 200),
  new ColumnConfig('productType', 'Product Type', true, '#EDEDEE', '#000', 200),
  new ColumnConfig('materialId', 'MM#', true, '#EDEDEE', '#000',150),
  new ColumnConfig('description', 'Long Description', true, '#EDEDEE', '#000', 200),
  new ColumnConfig('quantity', 'Order QTY', true, '#EDEDEE', '#000',150),
  new ColumnConfig('orderComments', 'Order Comments (Current Report)', true, '#EDEDEE', '#000',450),
  new ColumnConfig('orderStatus', 'Order Status', true, '#EDEDEE', '#000',200),
  new ColumnConfig('shipmentForecastedQuantity', 'Shipment Forecasted QTY', true, '#EDEDEE', '#000',250),
  new ColumnConfig('expectedDeliveryDate', 'Expected Delivery Date', true, '#EDEDEE', '#000',250),
  new ColumnConfig('connection', 'Connection', true, '#EDEDEE', '#000'),
  new ColumnConfig('pricePerFoot', 'Price Per Foot', true, '#EDEDEE', '#000',200)
];

export const lhandwellheadOrdersCols: ColumnConfig[] = [
  new ColumnConfig('id', '', false, '#EDEDEE', '#000', 200),
  new ColumnConfig('orderNumber', 'Order #', true, '#EDEDEE', '#000'),
  new ColumnConfig('productType', 'Product Type', true, '#EDEDEE', '#000'),
  new ColumnConfig('supplier', 'Supplier', true, '#EDEDEE', '#000'),
  new ColumnConfig('materialId', 'MM', true, '#EDEDEE', '#000'),
  new ColumnConfig('description', 'Long Description', true, '#EDEDEE', '#000'),
  new ColumnConfig('quantity', 'Order Quantity (FT)', true, '#EDEDEE', '#000'),
  new ColumnConfig('shipmentForecastedQuantity', 'Shipment Forecasted Quantity (ft)', true, '#EDEDEE', '#000'),
  new ColumnConfig('expectedDeliveryDate', 'Expected Delivery Date', true, '#EDEDEE', '#000'),
  new ColumnConfig('pricePerFoot', 'Price Per Foot', true, '#EDEDEE', '#000')
];

export const lhandwellheadOrdersColsNew: ColumnConfig[] = [
  new ColumnConfig('id', '', false, '#EDEDEE', '#000', 200),
  new ColumnConfig('materialType', 'Material Type', true, '#EDEDEE', '#000'),
  new ColumnConfig('materialNumber', 'Chevron MM #', true, '#EDEDEE', '#000',200),
  new ColumnConfig('description', 'Description', true, '#EDEDEE', '#000',200),
  new ColumnConfig('plantCode', 'Plant Code', true, '#EDEDEE', '#000'),
  new ColumnConfig('supplierPartNumber', 'Supplier Part #', true, '#EDEDEE', '#000',200),
  new ColumnConfig('pONumber', 'PO #', true, '#EDEDEE', '#000'),
  new ColumnConfig('heatNumber', 'Heat #', true, '#EDEDEE', '#000'),
  new ColumnConfig('orderDate', 'Order Date', true, '#EDEDEE', '#000'),
  new ColumnConfig('wBS', 'WBS', true, '#EDEDEE', '#000'),
  new ColumnConfig('project', 'Project', true, '#EDEDEE', '#000'),
  new ColumnConfig('unitCost', 'Unit Cost', true, '#EDEDEE', '#000'),
  new ColumnConfig('quantity', 'Quantity', true, '#EDEDEE', '#000'),
  new ColumnConfig('estimatedDeliveryDate', 'Estimated Delivery Date', true, '#EDEDEE', '#000',300),
  new ColumnConfig('newOrderLeadTimeDays', 'New Order Lead Times (Days)', true, '#EDEDEE', '#000',300),
  new ColumnConfig('comments', 'Comments', true, '#EDEDEE', '#000')
];

export const wellheadOrdersCols: ColumnConfig[] = [
  new ColumnConfig('id', '', false, '#EDEDEE', '#000', 200),
  new ColumnConfig('due', 'Due', true, '#EDEDEE', '#000'),
  new ColumnConfig('orderLine', 'Order Line', true, '#EDEDEE', '#000',200),
  new ColumnConfig('ponumber', 'PO Number', true, '#EDEDEE', '#000',200),
  new ColumnConfig('mmnumber', 'MM #', true, '#EDEDEE', '#000'),
  new ColumnConfig('cpnum', 'CP Num', true, '#EDEDEE', '#000',200),
  new ColumnConfig('customerDistrict', 'Customer/District', true, '#EDEDEE', '#000'),
  new ColumnConfig('orderNo', 'Order No', true, '#EDEDEE', '#000'),
  new ColumnConfig('item', 'Item', true, '#EDEDEE', '#000'),
  new ColumnConfig('qtyOpen', 'Qty Open', true, '#EDEDEE', '#000'),
  new ColumnConfig('salesValue', 'Sales Value', true, '#EDEDEE', '#000'),
  new ColumnConfig('costValue', 'Cost Value', true, '#EDEDEE', '#000'),
  new ColumnConfig('netAvail', 'Net Avail', true, '#EDEDEE', '#000'),
  new ColumnConfig('currentNet', 'Current Net', true, '#EDEDEE', '#000',300),
  new ColumnConfig('orderDate', 'Order Date', true, '#EDEDEE', '#000',300),
  new ColumnConfig('coord', 'Coord', true, '#EDEDEE', '#000'),
  new ColumnConfig('typeOfWork', 'Type of Work', true, '#EDEDEE', '#000'),
  new ColumnConfig('ordStatus', 'Ord Status', true, '#EDEDEE', '#000'),
  new ColumnConfig('mtrjob', 'MTR/Job', true, '#EDEDEE', '#000'),
  new ColumnConfig('jobStatus', 'Job Status', true, '#EDEDEE', '#000'),
  new ColumnConfig('comment', 'Comment', true, '#EDEDEE', '#000',300),
  new ColumnConfig('delivery', 'Delivery', true, '#EDEDEE', '#000',300)

];




