export interface Sapunitcost {
  materialId: string | null;                          // varchar, length 256, nullable
  materialShortDesc: string | null;                   // varchar, length 256, nullable
  plantCode: string | null;                           // varchar, length 256, nullable
  onHandQuantity: number | null;                      // decimal, precision 9, scale 18, nullable
  unitPriceUSD: number | null;                        // decimal, precision 9, scale 16, nullable
  rowId: number | null;                               // int, length 4, nullable
  latestRowIdPlant: number | null;                    // int, length 4, nullable
  latestRowIdAll: number | null;                      // int, length 4, nullable
  lastValueByPlant: string | null;                    // varchar, length 256, nullable
  lastValueAllPlant: string | null;                   // varchar, length 256, nullable
  cummValueByPlant: number | null;                    // decimal, precision 17, scale 38, nullable
  cummQuantityByPlant: number | null;                 // decimal, precision 17, scale 38, nullable
  incrementalCostBasisByPlant: number | null;         // decimal, precision 17, scale 38, nullable
  cummValueAllPlant: number | null;                   // decimal, precision 17, scale 38, nullable
  cummQuantityAllPlant: number | null;                // decimal, precision 17, scale 38, nullable
  mmCostBasisAvgAllPlant: number | null;              // decimal, precision 17, scale 38, nullable
  identifierByPlant: string | null;                   // varchar, length 256, nullable
  identifierAllPlant: string | null;                  // varchar, length 256, nullable
  asset: string | null;                               // varchar, length 256, nullable
  batch: string | null;                               // varchar, length 256, nullable
  category2Bucket: string | null;                     // varchar, length 256, nullable
}
