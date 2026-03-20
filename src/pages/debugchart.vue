<template>
    <div>
      <div ref="chart" style="width: 600px; height: 400px;"></div>
    </div>
  </template>
  
  <script>
  import * as echarts from 'echarts';
  
  export default {
    name: 'EchartsExample',
    mounted() {
      this.initChart();
    },
    methods: {
      initChart() {
        const chartDom = this.$refs.chart;
        const myChart = echarts.init(chartDom);
  
        const option = {
          title: {
            text: 'ECharts 示例',
            left: 'center'
          },
          tooltip: {
            trigger: 'item'
          },
          legend: {
            top: '10%',
            data: ['系列1', '系列2', '系列3'],
            selected: {
              '系列1': true,
              '系列2': true,
              '系列3': true
            },
          },
          xAxis: {
            type: 'category',
            data: ['A', 'B', 'C', 'D', 'E']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '系列1',
              type: 'line',  // 确保设置了 type
              data: [120, 132, 101, 134, 90],
              smooth: true,
            },
            {
              name: '系列2',
              type: 'line',  // 确保设置了 type
              data: [220, 182, 191, 234, 290],
              smooth: true,
            },
            {
              name: '系列3',
              type: 'line',  // 确保设置了 type
              data: [150, 232, 201, 154, 190],
              smooth: true,
            }
          ]
        };
  
        myChart.setOption(option);
      }
    }
  };
  </script>
  
  <style scoped>
  /* 可根据需求调整样式 */
  </style>
  