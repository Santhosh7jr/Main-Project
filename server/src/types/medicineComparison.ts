export interface MedicineComparisonRequest {
  medicine1Id: number;
  medicine2Id: number;
}


export interface MedicineComparison {
  medicine1: Medicine;
  medicine2: Medicine;

  sameFields: string[];

  differentFields: string[];

  uses: {
    shared: string[];
    medicine1Only: string[];
    medicine2Only: string[];
  };

  sideEffects: {
    shared: string[];
    medicine1Only: string[];
    medicine2Only: string[];
  };
}


export interface Medicine {
  id: number;
  name: string;

  genericName: string | null;

  therapeuticClass: string | null;

  actionClass: string | null;

  chemicalClass: string | null;

  habitForming: boolean;

  uses: string[];

  sideEffects: string[];
}