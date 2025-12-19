import MapboxDraw from "@mapbox/mapbox-gl-draw";

interface DrawPanelProps {
  draw?: MapboxDraw | null;
  onStartDrawing?: () => void;
}

export default function DrawPanel({
  draw: _draw,
  onStartDrawing,
}: DrawPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">วาดพื้นที่</h3>
      <button
        onClick={onStartDrawing}
        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
      >
        เริ่มวาดพื้นที่
      </button>
      <p className="text-sm text-gray-500 mt-4">
        Panel นี้กำลังพัฒนาสำหรับ DRIS Project
      </p>
    </div>
  );
}
