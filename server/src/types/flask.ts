export interface FlaskMedicine {
  name: string;
  genericName?: string | null;
  therapeuticClass?: string | null;
  actionClass?: string | null;
  chemicalClass?: string | null;
  habitForming?: boolean;
  uses?: string[];
}

export interface FlaskPredictRequest {
  medicine: FlaskMedicine;
}

export interface FlaskPredictedADR {
  adr: string;
  score: number;
}

export interface FlaskPredictionData {
  medicineText: string;
  predictedADRs: FlaskPredictedADR[];
  threshold: number;
}

export interface FlaskPredictionResponse {
  success: boolean;
  data?: FlaskPredictionData;
  message?: string;
  error?: string;
}