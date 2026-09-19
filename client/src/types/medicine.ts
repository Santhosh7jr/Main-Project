export interface Medicine {
  id: number;
  name: string;

  genericName: string | null;
  therapeuticClass: string | null;
  actionClass: string | null;
  chemicalClass: string | null;

  habitForming: boolean | null;

  uses: string[];
  sideEffects: string[];
}

// ============================================================
// Comparison
// ============================================================

export interface ComparisonFieldSame {
  field: string;
  label: string;
  value: string | boolean | null;
}

export interface ComparisonFieldDifferent {
  field: string;
  label: string;

  medicine1: string | boolean | null;
  medicine2: string | boolean | null;
}

export interface ComparisonList {
  shared: string[];
  medicine1Only: string[];
  medicine2Only: string[];
}

export interface MedicineComparison {
  medicine1: Medicine;
  medicine2: Medicine;

  sameFields: ComparisonFieldSame[];

  differentFields: ComparisonFieldDifferent[];

  uses: ComparisonList;

  sideEffects: ComparisonList;
}