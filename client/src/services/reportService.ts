import api from "./api";

import type {
  ReportAssessment,
  ReportSummary,
} from "../types/report";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getReportSummary =
  async (): Promise<ReportSummary> => {
    const response =
      await api.get<ApiResponse<ReportSummary>>(
        "/reports/summary"
      );

    return response.data.data;
  };

export const getAssessmentReports =
  async (): Promise<ReportAssessment[]> => {
    const response =
      await api.get<ApiResponse<ReportAssessment[]>>(
        "/reports/assessments"
      );

    return response.data.data;
  };

export const updateAlternativeDecision = async (
  assessmentId: number,
  medicineId: number,
  decision: "selected" | "rejected" | "deferred",
) => {
  const response = await api.put<ApiResponse<{
    medicineId: number;
    reviewStatus: string;
    doctorDecision: string;
    reviewedAt: string;
  }>>(
    `/reports/assessments/${assessmentId}/alternatives/${medicineId}`,
    { decision },
  );
  return response.data.data;
};
