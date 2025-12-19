import { useRef, useImperativeHandle, forwardRef } from "react";
import ReactEcharts from "echarts-for-react";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  viType: string;
  height?: string;
  showLegend?: boolean;
  title?: string;
  isMobile?: boolean;
}

export interface TimeSeriesChartRef {
  downloadImage: (filename?: string) => void;
  getDataURL: () => string;
}

const TimeSeriesChart = forwardRef<TimeSeriesChartRef, TimeSeriesChartProps>(
  (
    {
      data,
      viType,
      height = "200px",
      showLegend = true,
      title,
      isMobile = false,
    },
    ref
  ) => {
    const chartRef = useRef<ReactEcharts>(null);

    // Expose download methods via ref
    useImperativeHandle(ref, () => ({
      downloadImage: (filename?: string) => {
        if (chartRef.current) {
          const echartInstance = chartRef.current.getEchartsInstance();
          const url = echartInstance.getDataURL({
            type: "png",
            pixelRatio: 2,
            backgroundColor: "#fff",
          });
          const link = document.createElement("a");
          link.href = url;
          link.download = filename || `${viType}_chart.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      getDataURL: () => {
        if (chartRef.current) {
          const echartInstance = chartRef.current.getEchartsInstance();
          return echartInstance.getDataURL({
            type: "png",
            pixelRatio: 2,
            backgroundColor: "#fff",
          });
        }
        return "";
      },
    }));

    // Different styles for mobile vs desktop
    const styles = isMobile
      ? {
          titleFontSize: 12,
          legendTop: title ? 32 : 0,
          legendFontSize: 10,
          gridTop: title ? "38%" : showLegend ? "18%" : "10%",
          axisFontSize: 9,
          tooltipFontSize: 11,
        }
      : {
          titleFontSize: 14,
          legendTop: title ? 30 : 0,
          legendFontSize: 12,
          gridTop: title ? "20%" : showLegend ? "15%" : "10%",
          axisFontSize: 10,
          tooltipFontSize: 12,
        };

    const chartOption = {
      title: title
        ? {
            text: title,
            left: "center",
            textStyle: {
              fontSize: styles.titleFontSize,
              fontWeight: 600,
              color: "#1f2937",
              fontFamily: "inherit",
            },
          }
        : undefined,
      tooltip: {
        trigger: "axis",
        textStyle: {
          fontSize: styles.tooltipFontSize,
          fontFamily: "inherit",
        },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/>${viType}: ${item.value.toFixed(4)}`;
        },
      },
      legend: showLegend
        ? {
            data: [viType],
            top: styles.legendTop,
            textStyle: {
              fontSize: styles.legendFontSize,
              fontFamily: "inherit",
            },
          }
        : undefined,
      grid: {
        left: "12%",
        right: "5%",
        top: styles.gridTop,
        bottom: "15%",
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.date),
        axisLabel: {
          fontSize: styles.axisFontSize,
          color: "#6b7280",
          fontFamily: "inherit",
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: styles.axisFontSize,
          color: "#6b7280",
          fontFamily: "inherit",
          formatter: (value: number) => value.toFixed(2),
        },
      },
      series: [
        {
          name: viType,
          type: "line",
          data: data.map((d) => d.value),
          smooth: true,
          lineStyle: {
            color: "#16a34a",
            width: 2,
          },
          areaStyle: {
            color: "rgba(22, 163, 74, 0.1)",
          },
          itemStyle: {
            color: "#16a34a",
          },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    };

    if (data.length === 0) {
      return (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            height,
            background: "#f9fafb",
            border: "1px dashed #d1d5db",
          }}
        >
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            ไม่มีข้อมูล
          </span>
        </div>
      );
    }

    return (
      <ReactEcharts
        ref={chartRef}
        option={chartOption}
        style={{ height, width: "100%" }}
      />
    );
  }
);

TimeSeriesChart.displayName = "TimeSeriesChart";

export default TimeSeriesChart;
