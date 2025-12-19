import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { Download } from "lucide-react";
import { useField } from "../contexts/FieldContext";
import axios from "../config/axios";

interface Field {
  id: string;
  name: string;
  user_id?: string;
  crop_type?: string;
  variety?: string;
  planting_season?: string;
  planting_date?: string;
  geometry: any;
  area_m2: number;
  centroid_lat: number;
  centroid_lng: number;
  address?: string;
  created_at?: string;
}

export function useFieldActions(field: Field, onUpdate?: () => void) {
  const { updateField, deleteField } = useField();

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: field.name,
    crop_type: field.crop_type || "ข้าวหอมมะลิ",
    variety: field.variety || "ข้าวหอมมะลิ",
    planting_season: field.planting_season || "",
    planting_date: field.planting_date
      ? new Date(field.planting_date).toISOString().split("T")[0]
      : "",
  });

  // Download Panel State
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "shp" | "gpkg" | "kml" | "geojson" | "csv_wkt"
  >("geojson");

  // Update form data when field changes
  useEffect(() => {
    if (field && field.id) {
      setEditFormData({
        name: field.name,
        crop_type: field.crop_type || "ข้าวหอมมะลิ",
        variety: field.variety || "ข้าวหอมมะลิ",
        planting_season: field.planting_season || "",
        planting_date: field.planting_date
          ? new Date(field.planting_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [field.id]);

  // ========== DELETE ==========
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `คุณต้องการลบแปลง "${field.name}" หรือไม่?\n\nการลบนี้ไม่สามารถยกเลิกได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        await deleteField(field.id);
        Swal.fire({
          title: "สำเร็จ",
          text: "ลบแปลงสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
        if (onUpdate) onUpdate();
      } catch (error: any) {
        let errorMessage = "ลบแปลงไม่สำเร็จ";
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "ไม่พบแปลงที่ต้องการลบ";
          } else if (error.response.status === 403) {
            errorMessage = "คุณไม่มีสิทธิ์ลบแปลงนี้";
          } else {
            errorMessage = error.response.data?.detail || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    }
  };

  // ========== EDIT ==========
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let planting_date = null;
      if (editFormData.planting_date) {
        planting_date = new Date(editFormData.planting_date).toISOString();
      }

      const updateData = {
        name: editFormData.name.trim(),
        crop_type: editFormData.crop_type,
        variety: editFormData.variety,
        planting_season: editFormData.planting_season || null,
        planting_date: planting_date,
      };

      await updateField(field.id, updateData);
      setShowEditModal(false);
      Swal.fire({
        title: "สำเร็จ",
        text: "แก้ไขแปลงสำเร็จ!",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "แก้ไขแปลงไม่สำเร็จ: " + error.message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ========== DOWNLOAD ==========
  const geojsonFeatureCollection = () => ({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: field.geometry,
        properties: {
          name: field.name,
          crop_type: field.crop_type,
          area_m2: field.area_m2,
          planting_date: field.planting_date,
        },
      },
    ],
  });

  const toSafeFilename = (name: string, fallbackBase: string) => {
    try {
      const ascii = name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
      const base = ascii && /[a-z0-9]/.test(ascii) ? ascii : fallbackBase;
      return base;
    } catch {
      return fallbackBase;
    }
  };

  const fileBase = toSafeFilename(field.name, `field_${field.id}`);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsGeoJSON = () => {
    const geo = geojsonFeatureCollection();
    const blob = new Blob([JSON.stringify(geo, null, 2)], {
      type: "application/geo+json",
    });
    downloadBlob(blob, `${fileBase}.geojson`);
  };

  const exportAsKML = () => {
    try {
      const feature = geojsonFeatureCollection().features[0];
      const geom = feature.geometry;
      const polygons: number[][][][] =
        geom.type === "Polygon"
          ? [geom.coordinates]
          : geom.type === "MultiPolygon"
          ? geom.coordinates
          : [];

      const polygonPlacemarks = polygons
        .map((ringSets, idx) => {
          const outer = ringSets[0];
          const coords = outer.map(([lng, lat]) => `${lng},${lat},0`).join(" ");
          return `
        <Placemark>
          <name>${field.name}${polygons.length > 1 ? ` ${idx + 1}` : ""}</name>
          <ExtendedData>
            <Data name="crop_type"><value>${
              field.crop_type || ""
            }</value></Data>
            <Data name="area_m2"><value>${field.area_m2}</value></Data>
            <Data name="planting_date"><value>${
              field.planting_date || ""
            }</value></Data>
          </ExtendedData>
          <Style><LineStyle><color>ff2b7a4b</color><width>2</width></LineStyle><PolyStyle><color>1a2b7a4b</color></PolyStyle></Style>
          <Polygon>
            <outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs>
          </Polygon>
        </Placemark>`;
        })
        .join("\n");
      const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${field.name}</name>${polygonPlacemarks}
  </Document>
</kml>`;
      const blob = new Blob([kml], {
        type: "application/vnd.google-earth.kml+xml;charset=utf-8",
      });
      downloadBlob(blob, `${fileBase}.kml`);
    } catch (e) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "แปลงไฟล์ KML ไม่สำเร็จ",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
      console.error(e);
    }
  };

  const geojsonToWKT = (): string => {
    const geom = field.geometry;
    if (!geom) return "";
    const toPair = (c: number[]) => `${c[0]} ${c[1]}`;
    if (geom.type === "Point") {
      return `POINT (${toPair(geom.coordinates)})`;
    }
    if (geom.type === "LineString") {
      return `LINESTRING (${geom.coordinates.map(toPair).join(", ")})`;
    }
    if (geom.type === "Polygon") {
      const rings = geom.coordinates
        .map((ring: number[][]) => `(${ring.map(toPair).join(", ")})`)
        .join(", ");
      return `POLYGON (${rings})`;
    }
    if (geom.type === "MultiPolygon") {
      const polys = geom.coordinates
        .map(
          (poly: number[][][]) =>
            `(${poly
              .map((ring: number[][]) => `(${ring.map(toPair).join(", ")})`)
              .join(", ")})`
        )
        .join(", ");
      return `MULTIPOLYGON (${polys})`;
    }
    return "";
  };

  const exportAsCSVWKT = () => {
    const headers = ["name", "crop_type", "area_m2", "planting_date", "wkt"];
    const wkt = geojsonToWKT();
    const row = [
      field.name,
      field.crop_type || "",
      String(field.area_m2),
      field.planting_date || "",
      wkt,
    ]
      .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
      .join(",");
    const BOM = "\uFEFF";
    const csv = BOM + headers.join(",") + "\n" + row;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${fileBase}.csv`);
  };

  const handleDownload = () => {
    setShowDownloadPanel(true);
    setShowFormatMenu(false);
  };

  const confirmDownload = () => {
    switch (exportFormat) {
      case "geojson":
        exportAsGeoJSON();
        break;
      case "kml":
        (async () => {
          try {
            const res = await axios.get(`/fields/${field.id}/export/kml`, {
              responseType: "blob",
            });
            const blob = new Blob([res.data], {
              type: "application/vnd.google-earth.kml+xml",
            });
            downloadBlob(blob, `${fileBase}.kml`);
          } catch (err) {
            console.warn(
              "Backend KML export failed; falling back to client conversion",
              err
            );
            exportAsKML();
          }
        })();
        break;
      case "csv_wkt":
        exportAsCSVWKT();
        break;
      case "shp":
      case "gpkg":
        (async () => {
          try {
            const res = await axios.get(
              `/fields/${field.id}/export/${exportFormat}`,
              { responseType: "blob" }
            );
            const filename = `${fileBase}.${
              exportFormat === "shp" ? "zip" : "gpkg"
            }`;
            const type =
              exportFormat === "shp"
                ? "application/zip"
                : "application/geopackage+sqlite3";
            const blob = new Blob([res.data], { type });
            downloadBlob(blob, filename);
          } catch (err: any) {
            const message =
              err?.response?.data?.detail ||
              "ไม่สามารถส่งออกไฟล์ได้ โปรดลองอีกครั้ง";
            Swal.fire({
              title: message.includes("สำเร็จ") ? "สำเร็จ" : "เกิดข้อผิดพลาด",
              text: message,
              icon: message.includes("สำเร็จ") ? "success" : "error",
              confirmButtonText: "ตกลง",
            });
          }
        })();
        break;
      default:
        exportAsGeoJSON();
    }
    setShowDownloadPanel(false);
  };

  // ========== RENDER MODALS ==========
  const EditModal = showEditModal
    ? ReactDOM.createPortal(
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#1a1a1a",
              }}
            >
              แก้ไขข้อมูลแปลง
            </h2>

            <form onSubmit={handleEditSubmit}>
              {/* ชื่อแปลง */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  ชื่อแปลง *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* ประเภทพืช */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  ประเภทพืช
                </label>
                <select
                  value={editFormData.crop_type}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      crop_type: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="ข้าว">ข้าว</option>
                  <option value="ข้าวโพด">ข้าวโพด</option>
                  <option value="อ้อย">อ้อย</option>
                  <option value="มันสำปะหลัง">มันสำปะหลัง</option>
                  <option value="ยางพารา">ยางพารา</option>
                  <option value="ปาล์มน้ำมัน">ปาล์มน้ำมัน</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              {/* สายพันธุ์ */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  สายพันธุ์
                </label>
                <select
                  value={editFormData.variety}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      variety: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="ข้าวหอมมะลิ">ข้าวหอมมะลิ</option>
                  <option value="ข้าวกข6">ข้าวกข6</option>
                  <option value="ข้าวกข15">ข้าวกข15</option>
                  <option value="ข้าวปทุมธานี">ข้าวปทุมธานี</option>
                  <option value="ข้าวเหนียว">ข้าวเหนียว</option>
                  <option value="ข้าวไรซ์เบอรี่">ข้าวไรซ์เบอรี่</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              {/* ฤดูกาล */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  ฤดูกาล
                </label>
                <select
                  value={editFormData.planting_season}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      planting_season: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="">เลือกฤดูกาล</option>
                  <option value="นาปี">นาปี - ปลูกฤดูฝน</option>
                  <option value="นาปรัง">นาปรัง - ปลูกนอกฤดู</option>
                  <option value="นาดำ">นาดำ</option>
                  <option value="นาหว่าน">นาหว่าน</option>
                </select>
              </div>

              {/* วันที่ปลูก */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  วันที่ปลูก
                </label>
                <input
                  type="date"
                  value={editFormData.planting_date}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      planting_date: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  const DownloadPanel = showDownloadPanel
    ? ReactDOM.createPortal(
        <div
          onClick={() => {
            setShowDownloadPanel(false);
            setShowFormatMenu(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              width: "360px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#eaf5ef",
                  color: "#1f9d55",
                  fontSize: "22px",
                }}
              >
                <Download size={24} />
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                color: "#0f3d23",
                marginBottom: "12px",
              }}
            >
              ดาวน์โหลดไฟล์แปลงของคุณ
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFormatMenu((v) => !v)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #184a2f",
                  textAlign: "left",
                  background: "#fff",
                  color: "#184a2f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>
                  {exportFormat === "shp" && "ESRI Shapefile"}
                  {exportFormat === "gpkg" && "GeoPackage"}
                  {exportFormat === "kml" && "Keyhole Markup Language (KML)"}
                  {exportFormat === "geojson" && "GeoJSON"}
                  {exportFormat === "csv_wkt" && "CSV (WKT)"}
                </span>
                <span>▾</span>
              </button>
              {showFormatMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "52px",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    zIndex: 10,
                  }}
                >
                  {[
                    { key: "shp", label: "ESRI Shapefile", disabled: false },
                    { key: "gpkg", label: "GeoPackage", disabled: false },
                    { key: "kml", label: "Keyhole Markup Language (KML)" },
                    { key: "geojson", label: "GeoJSON" },
                    { key: "csv_wkt", label: "CSV (WKT)" },
                  ].map((opt: any) => (
                    <div
                      key={opt.key}
                      onClick={() => {
                        if (opt.disabled) return;
                        setExportFormat(opt.key);
                        setShowFormatMenu(false);
                      }}
                      style={{
                        padding: "12px 14px",
                        cursor: opt.disabled ? "not-allowed" : "pointer",
                        color: opt.disabled ? "#a1a1aa" : "#0f3d23",
                        background: "#fff",
                      }}
                      title={opt.disabled ? "เร็วๆ นี้" : undefined}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDownloadPanel(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDownload}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#1f9d55",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ดาวน์โหลด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return {
    handleEdit,
    handleDownload,
    handleDelete,
    EditModal,
    DownloadPanel,
  };
}
