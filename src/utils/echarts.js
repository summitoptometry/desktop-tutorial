import * as echarts from 'echarts';

// 注册主题（如果需要）
// import theme from './echarts-theme.json';
// echarts.registerTheme('custom-theme', theme);

// 初始化图表实例
export const initChart = (dom) => {
  try {
    if (!dom) {
      console.error('DOM元素为空');
      return null;
    }
    
    const chart = echarts.init(dom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    
    console.log('ECharts实例创建成功');
    return chart;
  } catch (error) {
    console.error('创建ECharts实例失败:', error);
    return null;
  }
};

// 基础配置
export const baseOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: []
};

// 眼轴长度趋势图配置
export const axialLengthOption = {
  ...baseOption,
  title: {
    text: '眼轴长度趋势',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      const date = params[0].axisValue;
      let result = `${date}<br/>`;
      params.forEach(param => {
        const value = param.value;
        const change = param.data.change;
        const changeText = change ? 
          (change.isIncrease ? 
            `<span style="color: #ff4d4f">↑${change.value}</span>` : 
            `<span style="color: #52c41a">↓${change.value}</span>`) : '';
        result += `${param.seriesName}: ${value} ${changeText}<br/>`;
      });
      return result;
    }
  },
  legend: {
    data: ['右眼', '左眼'],
    top: 30
  },
  series: [
    {
      name: '右眼',
      type: 'line',
      data: [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#1890ff'
      }
    },
    {
      name: '左眼',
      type: 'line',
      data: [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#52c41a'
      }
    }
  ]
};

// 7天趋势图配置
export const weeklyTrendOption = {
  ...baseOption,
  title: {
    text: '最近7天工作趋势',
    left: 'center',
    top: 10,
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      const date = params[0].axisValue;
      let result = `${date}<br/>`;
      params.forEach(param => {
        if (param.seriesName.includes('平均值')) {
          result += `${param.seriesName}: ${param.value} 人<br/>`;
        } else {
          result += `${param.seriesName}: ${param.value} 人<br/>`;
        }
      });
      return result;
    }
  },
  legend: {
    data: ['建档量', '复查量', '建档量平均值', '复查量平均值'],
    top: 50,
    left: 'center',
    textStyle: {
      fontSize: 12
    },
    itemWidth: 15,
    itemHeight: 10,
    itemGap: 20
  },
  grid: {
    left: '8%',
    right: '4%',
    bottom: '15%',
    top: '20%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    data: [],
    axisLabel: {
      fontSize: 12,
      color: '#666',
      formatter: function(value, index) {
        // 获取星期几
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const date = new Date('2024-' + value);
        const weekday = weekdays[date.getDay()];
        return value + '\n' + weekday;
      }
    }
  },
  yAxis: {
    type: 'value',
    name: '人数',
    nameTextStyle: {
      fontSize: 12,
      color: '#666'
    },
    axisLabel: {
      fontSize: 12,
      color: '#666'
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: '#e8e8e8'
      }
    }
  },
  series: [
    {
      name: '建档量',
      type: 'line',
      coordinateSystem: 'cartesian2d',
      data: [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#667eea'
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 12,
        color: '#667eea'
      }
    },
    {
      name: '复查量',
      type: 'line',
      coordinateSystem: 'cartesian2d',
      data: [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#f093fb'
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 12,
        color: '#f093fb'
      }
    },
    {
      name: '建档量平均值',
      type: 'line',
      coordinateSystem: 'cartesian2d',
      data: [],
      smooth: false,
      symbol: 'none',
      lineStyle: {
        type: 'dashed',
        width: 2,
        color: '#667eea'
      },
      itemStyle: {
        color: '#667eea'
      }
    },
    {
      name: '复查量平均值',
      type: 'line',
      coordinateSystem: 'cartesian2d',
      data: [],
      smooth: false,
      symbol: 'none',
      lineStyle: {
        type: 'dashed',
        width: 2,
        color: '#f093fb'
      },
      itemStyle: {
        color: '#f093fb'
      }
    }
  ]
};

export default echarts; 