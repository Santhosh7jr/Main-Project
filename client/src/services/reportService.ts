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
