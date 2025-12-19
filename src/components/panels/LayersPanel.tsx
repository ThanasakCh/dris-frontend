interface LayersPanelProps {
  onToggleLayer?: (layer: string) => void;
}

export default function LayersPanel({
  onToggleLayer: _onToggleLayer,
}: LayersPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">ชั้นข้อมูล</h3>
      <p className="text-sm text-gray-500 mt-4">
        Panel นี้กำลังพัฒนาสำหรับ DRIS Project
      </p>
    </div>
  );
}
