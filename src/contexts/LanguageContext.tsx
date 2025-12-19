import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "TH" | "EN";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Thai translations (default)
const translations: Record<Language, Record<string, string>> = {
  TH: {
    // Header
    "header.logout": "ออกจากระบบ7",
    "header.switchLanguage": "เปลี่ยนภาษา",
    "header.darkMode": "โหมดมืด",
    "header.lightMode": "โหมดสว่าง",
    "header.toggleSidebar": "เปิด/ปิดแถบด้านข้าง",
    "header.toggleMenu": "เปิด/ปิดเมนู",

    // Field Details
    "field.details": "รายละเอียดแปลง",
    "field.select": "เลือกแปลง",
    "field.myFields": "แปลงของฉัน",
    "field.allFields": "แปลงของฉันทั้งหมด",
    "field.noFields": "ยังไม่มีแปลง",
    "field.createFirst": "กรุณาสร้างแปลงก่อน",
    "field.searchPlaceholder": "ค้นหาแปลงของฉัน",
    "field.notFound": "ไม่พบแปลงที่ค้นหา",
    "field.total": "มีทั้งหมด",
    "field.unit": "แปลง",
    "field.noAddress": "ไม่ระบุที่อยู่",
    "field.rai": "ไร่",
    "field.ngan": "งาน",
    "field.sqWa": "ตารางวา",
    "field.name": "ชื่อแปลง",
    "field.health": "สุขภาพแปลง",
    "field.saveNew": "บันทึกแปลงใหม่",
    "field.drawShape": "วาดรูปแปลง",
    "field.dataLayers": "ชั้นข้อมูล",
    "field.stats": "สถิติ",
    "field.tools": "เครื่องมือ",
    "field.placeholder": "เช่น แปลง A1",
    "field.addNew": "เพิ่มแปลงใหม่",

    // Actions
    "action.edit": "แก้ไข",
    "action.delete": "ลบ",
    "action.download": "ดาวน์โหลด",
    "action.save": "บันทึก",
    "action.saveField": "บันทึกแปลง",
    "action.cancel": "ยกเลิก",
    "action.confirm": "ยืนยัน",
    "action.ok": "ตกลง",
    "action.copied": "คัดลอกแล้ว",
    "action.back": "กลับ",
    "action.analyze": "วิเคราะห์",
    "action.analyzing": "กำลังวิเคราะห์...",
    "action.saving": "กำลังบันทึก...",
    "action.image": "รูปภาพ",
    "action.import": "นำเข้าแปลง",
    "action.importing": "กำลังนำเข้า...",
    "action.hide": "ซ่อน",
    "action.selectTime": "เลือกช่วงเวลา",

    // Confirm dialogs
    "confirm.delete": "ยืนยันการลบ",
    "confirm.deleteMessage": "คุณต้องการลบแปลงนี้หรือไม่?",
    "confirm.deleted": "ลบสำเร็จ",
    "confirm.error": "เกิดข้อผิดพลาด",
    "confirm.deleteError": "ไม่สามารถลบแปลงได้",
    "confirm.success": "สำเร็จ",
    "confirm.warning": "แจ้งเตือน",
    "confirm.failed": "ไม่สำเร็จ",

    // Features
    "feature.health": "ติดตามความ\nสมบูรณ์ของพืช",
    "feature.weather": "สภาพอากาศ",
    "feature.analysis": "วิเคราะห์แนวโน้ม",
    "feature.fertilizer": "แนะนำการใส่ปุ๋ย",
    "feature.disaster": "ภัยพิบัติ",
    "feature.notebook": "สมุดบันทึก",
    "feature.price": "ราคาผลผลิต",
    "feature.score": "คะแนนแปลง\nเกษตรกร",
    "feature.disease": "โรคและแมลง",
    "feature.forecast": "คาดการณ์\nผลผลิต",
    "feature.water": "แหล่งน้ำนา\n/เล็ก",
    "feature.burn": "ประวัติการเผา\n[ใหม่]",
    "feature.pest": "ภัยพืช",

    // Map
    "map.selectBasemap": "เลือกแผนที่",
    "map.light": "แผนที่สว่าง",
    "map.dark": "แผนที่มืด",
    "map.voyager": "แผนที่มาตรฐาน",
    "map.streets": "แผนที่ถนน",
    "map.satellite": "ภาพดาวเทียม",
    "map.osm": "แผนที่ OSM",
    "map.myLocation": "ตำแหน่งของฉัน",
    "map.layers": "เลเยอร์",
    "map.zoomIn": "ซูมเข้า",
    "map.zoomOut": "ซูมออก",

    // Draw Polygon
    "draw.title": "วาดโพลิกอน",
    "draw.start": "เริ่มวาด",
    "draw.saved": "บันทึกแล้ว",
    "draw.noFields": "ยังไม่มีแปลง กดวาดแปลงใหม่",
    "draw.cancelDrawing": "ยกเลิกการวาด",
    "draw.pleaseDrawFirst": "กรุณาวาดรูปแปลงบนแผนที่ก่อน",
    "draw.enterFieldName": "กรุณากรอกชื่อแปลง",
    "draw.createSuccess": "สร้างแปลงสำเร็จ!",
    "draw.createFailed": "สร้างแปลงไม่สำเร็จ",
    "draw.selectTool": "เลือกเครื่องมือจากแถบด้านซ้าย",
    "draw.supportedFormats": "รองรับไฟล์: GeoJSON, KML, SHP (ZIP)",
    "draw.uploadZip": "กรุณาอัพโหลดไฟล์ ZIP",
    "draw.uploadZipDetail": "ไฟล์ Shapefile ต้องอัพโหลดเป็นไฟล์ .zip",
    "draw.importSuccess": "นำเข้าสำเร็จ",
    "draw.importedFrom": "นำเข้าแปลงจากไฟล์",
    "draw.fileNotSupported": "ไม่รองรับไฟล์นามสกุลนี้",
    "draw.noGeometry": "ไม่พบข้อมูล geometry ในไฟล์",
    "draw.polygonOnly": "ต้องเป็น Polygon หรือ MultiPolygon เท่านั้น",
    "draw.cannotReadFile": "ไม่สามารถอ่านไฟล์ได้",

    // Farming
    "farm.riceVariety": "สายพันธุ์ข้าว",
    "farm.jasmine": "ข้าวหอมมะลิ",
    "farm.riceKK6": "ข้าวกข6",
    "farm.riceKK15": "ข้าวกข15",
    "farm.ricePT": "ข้าวปทุมธานี",
    "farm.stickyRice": "ข้าวเหนียว",
    "farm.riceberry": "ข้าวไรซ์เบอรี่",
    "farm.other": "อื่นๆ",
    "farm.plantingSeason": "ฤดูกาลปลูก",
    "farm.selectSeason": "เลือกฤดูกาล",
    "farm.wetSeason": "นาปี - ปลูกฤดูฝน",
    "farm.drySeason": "นาปรัง - ปลูกนอกฤดู",
    "farm.transplant": "นาดำ",
    "farm.broadcast": "นาหว่าน",
    "farm.plantingDate": "วันที่ปลูก",

    // Season
    "season.cycle": "รอบการเพาะปลูก",

    // Loading
    "loading.message": "กำลังโหลดข้อมูล...",

    // User
    "user.admin": "ผู้ดูแลระบบ",
    "user.farmer": "เกษตรกร",

    // Legend
    "legend.title": "คำอธิบายสัญลักษณ์",

    // Analysis
    "analysis.fieldStatus": "สภาพแปลง",
    "analysis.trend": "แนวโน้ม",
    "analysis.analyzeTrend": "วิเคราะห์แนวโน้ม",
    "analysis.analyzeSatellite": "วิเคราะห์ข้อมูลดาวเทียม",
    "analysis.results": "ผลการวิเคราะห์",
    "analysis.dataPoints": "จุดข้อมูล",
    "analysis.selectVI": "เลือกดัชนีพืช",
    "analysis.selectVIDesc": "เลือกดัชนีที่ต้องการวิเคราะห์",
    "analysis.selectVITrendDesc": "เลือกดัชนีที่ต้องการวิเคราะห์แนวโน้ม",
    "analysis.viIndex": "ดัชนีพืช:",
    "analysis.type": "ประเภทการวิเคราะห์",
    "analysis.monthRange": "ช่วงเดือน",
    "analysis.fullYear": "ทั้งปี",
    "analysis.tenYearAvg": "10 ปีย้อนหลัง",
    "analysis.year": "ปี:",
    "analysis.startMonth": "เริ่ม:",
    "analysis.endMonth": "สิ้นสุด:",
    "analysis.selectTimeToAnalyze":
      "เลือกช่วงเวลาแล้วกดวิเคราะห์เพื่อดูแนวโน้ม",
    "analysis.noDataWarning":
      "ไม่พบข้อมูลในช่วงเวลาที่เลือก กรุณาเลือกช่วงเวลาอื่น",
    "analysis.noSatelliteData": "ไม่สามารถดึงข้อมูลดาวเทียมได้",
    "analysis.noSatelliteDataDesc":
      "สาเหตุที่เป็นไปได้: ไม่มีข้อมูลดาวเทียมใสสำหรับพื้นที่นี้ หรือ Google Earth Engine ยังไม่ได้ตั้งค่า กรุณาลองใหม่อีกครั้ง",
    "analysis.completed": "วิเคราะห์เสร็จสิ้น!",
    "analysis.gotData": "ได้ข้อมูล",
    "analysis.images": "ภาพ",
    "analysis.differentDates": "วันที่แตกต่างกัน",
    "analysis.failedPrefix": "การวิเคราะห์ไม่สำเร็จ: ",
    "analysis.trendValue": "แนวโน้มค่า",

    // Health
    "health.title": "ติดตามความสมบูรณ์ของพืช",
    "health.avgLevel": "ค่าเฉลี่ยระดับความสมบูรณ์พืช",
    "health.low": "น้อย",
    "health.high": "มาก",
    "health.weak": "พืชมีความอ่อนแอหรือความหนาแน่นต่ำ",
    "health.moderate": "พืชมีความสมบูรณ์หรือหนาแน่นปานกลาง",
    "health.good": "พืชมีความสมบูรณ์ดี หนาแน่นสูง",
    "health.excellent": "พืชมีความสมบูรณ์ดีเยี่ยม หนาแน่นมาก",

    // Months
    "month.jan": "มกราคม",
    "month.feb": "กุมภาพันธ์",
    "month.mar": "มีนาคม",
    "month.apr": "เมษายน",
    "month.may": "พฤษภาคม",
    "month.jun": "มิถุนายน",
    "month.jul": "กรกฎาคม",
    "month.aug": "สิงหาคม",
    "month.sep": "กันยายน",
    "month.oct": "ตุลาคม",
    "month.nov": "พฤศจิกายน",
    "month.dec": "ธันวาคม",

    // Sort
    "sort.latest": "เรียงตามแปลงที่เพิ่มล่าสุด",
    "sort.nameAZ": "เรียงตามชื่อแปลง (A → Z)",
    "sort.nameZA": "เรียงตามชื่อแปลง (Z → A)",

    // Sidebar
    "sidebar.healthTracking": "ติดตามสุขภาพพืช",
    "sidebar.about": "เกี่ยวกับ",
    "sidebar.location": "ภาคเหนือประเทศไทย",

    // About Page
    "about.title": "เกี่ยวกับโครงการ",
    "about.projectTitle": "ระบบติดตามและการวิเคราะห์สุขภาพพืช CMU-APSCO",
    "about.projectDesc":
      "โครงการนี้พัฒนาขึ้นภายใต้ความร่วมมือระหว่างมหาวิทยาลัยเชียงใหม่และองค์การความร่วมมือด้านอวกาศแห่งเอเชียแปซิฟิก (APSCO) เพื่อพัฒนาระบบติดตามและวิเคราะห์สุขภาพพืชสำหรับประเทศไทย โดยใช้เทคโนโลยีการสำรวจระยะไกลและระบบสารสนเทศภูมิศาสตร์",
    "about.objectives": "วัตถุประสงค์",
    "about.obj1":
      "ติดตามและวิเคราะห์สถานการณ์ภัยแล้งแบบเรียลไทม์ด้วยข้อมูลดาวเทียม",
    "about.obj2": "แสดงผลดัชนีภัยแล้ง TCI, VCI และ VHI ในรูปแบบแผนที่",
    "about.obj3":
      "วิเคราะห์ค่าสถิติเชิงพื้นที่ (Zonal Statistics) สำหรับพื้นที่ที่สนใจ",
    "about.obj4":
      "วิเคราะห์ค่าสถิติเชิงพื้นที่ (Zonal Statistics) สำหรับพื้นที่ที่สนใจ",
    "about.obj5": "รวบรวมและจัดเก็บข้อมูลจากการสำรวจภาคสนาม",
    "about.obj6": "สนับสนุนการตัดสินใจในการบริหารจัดการทรัพยากรน้ำและการเกษตร",
    "about.technology": "เทคโนโลยีที่ใช้",
    "about.tech1Title": "ข้อมูลดาวเทียม",
    "about.tech1Desc":
      "ใช้ข้อมูลจาก NOAA AVHRR และ Google Earth Engine ในการวิเคราะห์ดัชนีภัยแล้ง",
    "about.tech2Title": "GeoServer",
    "about.tech2Desc":
      "แสดงผลข้อมูลภูมิสารสนเทศแบบ Raster Layers และให้บริการ WMS/WFS",
    "about.tech3Title": "PostGIS Database",
    "about.tech3Desc": "จัดเก็บข้อมูลภูมิสารสนเทศและข้อมูลการสำรวจภาคสนาม",
    "about.tech4Title": "วิเคราะห์อนุกรมเวลา",
    "about.tech4Desc":
      "วิเคราะห์แนวโน้มและรูปแบบของภัยแล้งตามช่วงเวลาตั้งแต่ปี 2000",
    "about.indices": "ดัชนีที่ใช้ในการประเมิน",
    "about.ndviTitle": "NDVI - Normalized Difference Vegetation Index",
    "about.ndviDesc":
      "ดัชนีพืชพรรณความแตกต่าง เป็นตัวชี้วัดมาตรฐานที่ใช้ในการประเมินปริมาณและความสมบูรณ์ของพืชสีเขียว โดยคำนวณจากค่าการสะท้อนแสงในช่วงคลื่นสีแดง (Red) และอินฟราเรดใกล้ (NIR) ค่า NDVI มีช่วง -1 ถึง 1 โดยค่าที่สูงแสดงถึงพืชที่มีความสมบูรณ์มากขึ้น",
    "about.eviTitle": "EVI - Enhanced Vegetation Index",
    "about.eviDesc":
      "ดัชนีพืชพรรณแบบปรับปรุง ออกแบบมาเพื่อลดอิทธิพลของชั้นบรรยากาศและพื้นดิน ช่วยให้วิเคราะห์พื้นที่ที่มีพืชพรรณหนาแน่นได้ดีกว่า NDVI โดยเพิ่มค่าการสะท้อนแสงสีน้ำเงิน (Blue) เข้ามาคำนวณ เหมาะสำหรับการติดตามพื้นที่ที่มีพืชปกคลุมสูง",
    "about.gndviTitle": "GNDVI - Green Normalized Difference Vegetation Index",
    "about.gndviDesc":
      "ดัชนีพืชพรรณสีเขียว คล้ายกับ NDVI แต่ใช้ช่วงคลื่นสีเขียว (Green) แทนสีแดง มีความไวต่อปริมาณคลอโรฟิลล์มากกว่า เหมาะสำหรับการประเมินความสมบูรณ์ของพืชในระยะที่ต้องการปุ๋ยไนโตรเจน และช่วยในการตรวจสอบสุขภาพของพืช",
    "about.ndwiTitle": "NDWI - Normalized Difference Water Index",
    "about.ndwiDesc":
      "ดัชนีความแตกต่างของน้ำ ใช้สำหรับติดตามปริมาณความชื้นในพืชและแหล่งน้ำ ช่วยให้เกษตรกรสามารถบริหารจัดการน้ำในแปลงนาได้อย่างมีประสิทธิภาพและทันต่อสถานการณ์ภัยแล้ง เหมาะสำหรับการตรวจสอบความเครียดจากภัยแล้ง",
    "about.saviTitle": "SAVI - Soil Adjusted Vegetation Index",
    "about.saviDesc":
      "ดัชนีพืชพรรณที่ปรับแก้ผลกระทบจากดิน เหมาะสำหรับพื้นที่ที่มีพืชปกคลุมน้อยหรือระยะเริ่มปลูก ซึ่งค่าการสะท้อนของดินอาจรบกวนค่าดัชนีพืชพรรณปกติ (NDVI) ได้ ช่วยให้การวิเคราะห์แม่นยำยิ่งขึ้นในพื้นที่ดินโล่ง",
    "about.vciTitle": "VCI - Vegetation Condition Index",
    "about.vciDesc":
      "ดัชนีสภาพพืชพรรณ ใช้เปรียบเทียบค่า NDVI ปัจจุบันกับค่าสูงสุดและต่ำสุดในอดีตของช่วงเวลาเดียวกัน เพื่อประเมินความรุนแรงของภัยแล้งและผลกระทบต่อผลผลิตทางการเกษตร ค่า VCI มีช่วง 0-100 โดยค่าที่ต่ำแสดงถึงสภาพความเครียดของพืช",
    "about.team": "ทีมพัฒนา",
    "about.teamDesc":
      "โครงการนี้พัฒนาโดยโครงการวิจัยเพื่อการประเมินและพยากรณ์ภัยแล้ง สำหรับการปรับตัวต่อการเปลี่ยนแปลงสภาพภูมิอากาศของเกษตรกรรายย่อยในภาคเหนือและภาคตะวันออกเฉียงเหนือของประเทศไทย คณะสังคมศาสตร์ มหาวิทยาลัยเชียงใหม่",
    "about.support":
      "ภายใต้การสนับสนุนจากองค์การความร่วมมือด้านอวกาศแห่งเอเชียแปซิฟิก (APSCO)",
    "about.contact": "ติดต่อ",
    "about.contactDesc":
      "สำหรับข้อมูลเพิ่มเติมกรุณาติดต่อ: โครงการวิจัยเพื่อการประเมินและพยากรณ์ภัยแล้ง สำหรับการปรับตัวต่อการเปลี่ยนแปลงสภาพภูมิอากาศของเกษตรกรรายย่อยในภาคเหนือและภาคตะวันออกเฉียงเหนือของประเทศไทย คณะสังคมศาสตร์ มหาวิทยาลัยเชียงใหม่",
  },
  EN: {
    // Header
    "header.logout": "Logout",
    "header.switchLanguage": "Switch Language",
    "header.darkMode": "Dark Mode",
    "header.lightMode": "Light Mode",
    "header.toggleSidebar": "Toggle Sidebar",
    "header.toggleMenu": "Toggle Menu",

    // Field Details
    "field.details": "Field Details",
    "field.select": "Select Field",
    "field.myFields": "My Fields",
    "field.allFields": "All My Fields",
    "field.noFields": "No fields yet",
    "field.createFirst": "Please create a field first",
    "field.searchPlaceholder": "Search my fields",
    "field.notFound": "No fields found",
    "field.total": "Total",
    "field.unit": "fields",
    "field.noAddress": "No address specified",
    "field.rai": "Rai",
    "field.ngan": "Ngan",
    "field.sqWa": "Sq.Wa",
    "field.name": "Field Name",
    "field.health": "Field Health",
    "field.saveNew": "Save New Field",
    "field.drawShape": "Draw Field",
    "field.dataLayers": "Data Layers",
    "field.stats": "Statistics",
    "field.tools": "Tools",
    "field.placeholder": "e.g. Field A1",
    "field.addNew": "Add New Field",

    // Actions
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.download": "Download",
    "action.save": "Save",
    "action.saveField": "Save Field",
    "action.cancel": "Cancel",
    "action.confirm": "Confirm",
    "action.ok": "OK",
    "action.copied": "Copied",
    "action.back": "Back",
    "action.analyze": "Analyze",
    "action.analyzing": "Analyzing...",
    "action.saving": "Saving...",
    "action.image": "Image",
    "action.import": "Import Field",
    "action.importing": "Importing...",
    "action.hide": "Hide",
    "action.selectTime": "Select Time",

    // Confirm dialogs
    "confirm.delete": "Confirm Delete",
    "confirm.deleteMessage": "Are you sure you want to delete this field?",
    "confirm.deleted": "Deleted Successfully",
    "confirm.error": "Error",
    "confirm.deleteError": "Cannot delete field",
    "confirm.success": "Success",
    "confirm.warning": "Warning",
    "confirm.failed": "Failed",

    // Features
    "feature.health": "Plant Health\nMonitoring",
    "feature.weather": "Weather",
    "feature.analysis": "Trend Analysis",
    "feature.fertilizer": "Fertilizer\nRecommendation",
    "feature.disaster": "Disaster",
    "feature.notebook": "Notebook",
    "feature.price": "Product Price",
    "feature.score": "Farmer\nField Score",
    "feature.disease": "Disease & Pests",
    "feature.forecast": "Yield\nForecast",
    "feature.water": "Water\nSource",
    "feature.burn": "Burn History\n[New]",
    "feature.pest": "Crop Pests",

    // Map
    "map.selectBasemap": "Select Basemap",
    "map.light": "Light Map",
    "map.dark": "Dark Map",
    "map.voyager": "Standard Map",
    "map.streets": "Street Map",
    "map.satellite": "Satellite",
    "map.osm": "OSM Map",
    "map.myLocation": "My Location",
    "map.layers": "Layers",
    "map.zoomIn": "Zoom In",
    "map.zoomOut": "Zoom Out",

    // Draw Polygon
    "draw.title": "Draw Polygon",
    "draw.start": "Start Drawing",
    "draw.saved": "Saved",
    "draw.noFields": "No fields yet. Draw a new field",
    "draw.cancelDrawing": "Cancel Drawing",
    "draw.pleaseDrawFirst": "Please draw a field on the map first",
    "draw.enterFieldName": "Please enter field name",
    "draw.createSuccess": "Field created successfully!",
    "draw.createFailed": "Failed to create field",
    "draw.selectTool": "Select tool from sidebar",
    "draw.supportedFormats": "Supported: GeoJSON, KML, SHP (ZIP)",
    "draw.uploadZip": "Please upload ZIP file",
    "draw.uploadZipDetail": "Shapefile must be uploaded as .zip file",
    "draw.importSuccess": "Import successful",
    "draw.importedFrom": "Imported field from file",
    "draw.fileNotSupported": "File type not supported",
    "draw.noGeometry": "No geometry found in file",
    "draw.polygonOnly": "Must be Polygon or MultiPolygon only",
    "draw.cannotReadFile": "Cannot read file",

    // Farming
    "farm.riceVariety": "Rice Variety",
    "farm.jasmine": "Jasmine Rice",
    "farm.riceKK6": "KDML105 Rice",
    "farm.riceKK15": "RD15 Rice",
    "farm.ricePT": "Pathum Thani Rice",
    "farm.stickyRice": "Sticky Rice",
    "farm.riceberry": "Riceberry",
    "farm.other": "Other",
    "farm.plantingSeason": "Planting Season",
    "farm.selectSeason": "Select Season",
    "farm.wetSeason": "Wet Season",
    "farm.drySeason": "Dry Season",
    "farm.transplant": "Transplanting",
    "farm.broadcast": "Broadcasting",
    "farm.plantingDate": "Planting Date",

    // Season
    "season.cycle": "Planting Cycle",

    // Loading
    "loading.message": "Loading...",

    // User
    "user.admin": "Admin",
    "user.farmer": "Farmer",

    // Legend
    "legend.title": "Legend",

    // Analysis
    "analysis.fieldStatus": "Field Status",
    "analysis.trend": "Trend",
    "analysis.analyzeTrend": "Analyze Trend",
    "analysis.analyzeSatellite": "Analyze Satellite Data",
    "analysis.results": "Analysis Results",
    "analysis.dataPoints": "data points",
    "analysis.selectVI": "Select Vegetation Index",
    "analysis.selectVIDesc": "Select index to analyze",
    "analysis.selectVITrendDesc": "Select index for trend analysis",
    "analysis.viIndex": "VI Index:",
    "analysis.type": "Analysis Type",
    "analysis.monthRange": "Month Range",
    "analysis.fullYear": "Full Year",
    "analysis.tenYearAvg": "10 Year Average",
    "analysis.year": "Year:",
    "analysis.startMonth": "Start:",
    "analysis.endMonth": "End:",
    "analysis.selectTimeToAnalyze":
      "Select time range and click analyze to view trend",
    "analysis.noDataWarning":
      "No data found for selected period. Please select another period",
    "analysis.noSatelliteData": "Cannot retrieve satellite data",
    "analysis.noSatelliteDataDesc":
      "Possible causes: No clear satellite data for this area or Google Earth Engine not configured. Please try again.",
    "analysis.completed": "Analysis complete!",
    "analysis.gotData": "Got",
    "analysis.images": "images",
    "analysis.differentDates": "different dates",
    "analysis.failedPrefix": "Analysis failed: ",
    "analysis.trendValue": "Trend value",

    // Health
    "health.title": "Plant Health Monitoring",
    "health.avgLevel": "Average Plant Health Level",
    "health.low": "Low",
    "health.high": "High",
    "health.weak": "Plants are weak or low density",
    "health.moderate": "Plants are moderately healthy",
    "health.good": "Plants are healthy with high density",
    "health.excellent": "Plants are excellent with very high density",

    // Months
    "month.jan": "January",
    "month.feb": "February",
    "month.mar": "March",
    "month.apr": "April",
    "month.may": "May",
    "month.jun": "June",
    "month.jul": "July",
    "month.aug": "August",
    "month.sep": "September",
    "month.oct": "October",
    "month.nov": "November",
    "month.dec": "December",

    // Sort
    "sort.latest": "Sort by latest added",
    "sort.nameAZ": "Sort by name (A → Z)",
    "sort.nameZA": "Sort by name (Z → A)",

    // Sidebar
    "sidebar.healthTracking": "Plant Health Tracking",
    "sidebar.about": "About",
    "sidebar.location": "Northern Thailand",

    // About Page
    "about.title": "About Project",
    "about.projectTitle": "Drought Monitoring and Forecasting System CMU-APSCO",
    "about.projectDesc":
      "This project was developed under collaboration between Chiang Mai University and Asia-Pacific Space Cooperation Organization (APSCO) to develop a drought monitoring and forecasting system for Thailand using remote sensing technology and geographic information systems.",
    "about.objectives": "Objectives",
    "about.obj1":
      "Real-time drought monitoring and analysis using satellite data",
    "about.obj2": "Display drought indices TCI, VCI and VHI in map format",
    "about.obj3": "Zonal Statistics analysis for areas of interest",
    "about.obj4": "Drought forecasting using Machine Learning techniques",
    "about.obj5": "Collect and store field survey data",
    "about.obj6":
      "Support decision-making for water resource and agricultural management",
    "about.technology": "Technology Used",
    "about.tech1Title": "Satellite Data",
    "about.tech1Desc":
      "Using data from NOAA AVHRR and Google Earth Engine for drought index analysis",
    "about.tech2Title": "GeoServer",
    "about.tech2Desc":
      "Display geospatial data as Raster Layers and provide WMS/WFS services",
    "about.tech3Title": "PostGIS Database",
    "about.tech3Desc": "Store geospatial data and field survey data",
    "about.tech4Title": "Time Series Analysis",
    "about.tech4Desc":
      "Analyze drought trends and patterns over time since 2000",
    "about.indices": "Assessment Indices",
    "about.ndviTitle": "NDVI - Normalized Difference Vegetation Index",
    "about.ndviDesc":
      "Normalized Difference Vegetation Index is a standard indicator used to assess the quantity and health of green vegetation. Calculated from the reflectance values in the Red and Near-Infrared (NIR) bands. NDVI ranges from -1 to 1, where higher values indicate healthier and denser vegetation.",
    "about.eviTitle": "EVI - Enhanced Vegetation Index",
    "about.eviDesc":
      "Enhanced Vegetation Index is designed to reduce atmospheric and soil background influences. It provides better analysis of areas with dense vegetation compared to NDVI by incorporating the Blue band reflectance in its calculation. Particularly useful for monitoring high canopy cover areas.",
    "about.gndviTitle": "GNDVI - Green Normalized Difference Vegetation Index",
    "about.gndviDesc":
      "Green Normalized Difference Vegetation Index is similar to NDVI but uses the Green band instead of Red. It is more sensitive to chlorophyll content, making it suitable for assessing vegetation health during nitrogen fertilizer application periods and for monitoring plant health.",
    "about.ndwiTitle": "NDWI - Normalized Difference Water Index",
    "about.ndwiDesc":
      "Normalized Difference Water Index is used to monitor moisture content in vegetation and water bodies. It helps farmers efficiently manage water in rice fields and respond timely to drought situations. Ideal for detecting water stress in crops.",
    "about.saviTitle": "SAVI - Soil Adjusted Vegetation Index",
    "about.saviDesc":
      "Soil Adjusted Vegetation Index mitigates the effects of soil background. It is suitable for areas with sparse vegetation or early growth stages where soil reflectance may interfere with standard vegetation indices (NDVI). Provides more accurate analysis in bare soil areas.",
    "about.vciTitle": "VCI - Vegetation Condition Index",
    "about.vciDesc":
      "Vegetation Condition Index compares current NDVI values with historical maximum and minimum values for the same period to assess drought severity and its impact on agricultural production. VCI ranges from 0-100, where lower values indicate vegetation stress.",
    "about.team": "Development Team",
    "about.teamDesc":
      "This project was developed by the Research Project for Drought Assessment and Forecasting for Climate Change Adaptation of Smallholder Farmers in Northern and Northeastern Thailand, Faculty of Social Sciences, Chiang Mai University.",
    "about.support":
      "Under support from Asia-Pacific Space Cooperation Organization (APSCO)",
    "about.contact": "Contact",
    "about.contactDesc":
      "For more information, please contact: Research Project for Drought Assessment and Forecasting for Climate Change Adaptation of Smallholder Farmers in Northern and Northeastern Thailand, Faculty of Social Sciences, Chiang Mai University.",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "TH";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "TH" ? "EN" : "TH"));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export { translations };
