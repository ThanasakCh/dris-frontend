interface AnalysisPanelProps {
  fieldId?: string;
}

export default function AnalysisPanel({ fieldId }: AnalysisPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">วิเคราะห์แนวโน้ม</h3>
      <p className="text-gray-600">Field ID: {fieldId}</p>
      <p className="text-sm text-gray-500 mt-4">
        Panel นี้กำลังพัฒนาสำหรับ DRIS Project
      </p>
    </div>
  );
}
